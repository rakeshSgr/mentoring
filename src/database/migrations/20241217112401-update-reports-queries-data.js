'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Insert data into the report_queries table
		await queryInterface.bulkInsert('report_queries', [
			{
				report_code: 'total_number_of_sessions_attended',
				query: `SELECT 
        COUNT(*) AS count
    FROM 
        public.session_attendees AS sa
    JOIN 
        public.sessions AS s
    ON 
        sa.session_id = s.id
    WHERE 
        (CASE WHEN :userId IS NOT NULL THEN sa.mentee_id = :userId ELSE TRUE END)
        AND sa.joined_at IS NOT NULL
        AND (CASE WHEN :start_date IS NOT NULL THEN s.start_date > :start_date ELSE TRUE END)
        AND (CASE WHEN :end_date IS NOT NULL THEN s.end_date < :end_date ELSE TRUE END)
        AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
        AND (
            CASE 
                WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE')
                WHEN :session_type = 'Public' THEN s.type = 'PUBLIC'
                WHEN :session_type = 'Private' THEN s.type = 'PRIVATE'
                ELSE TRUE
            END
        );`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'total_hours_of_learning',
				query: `SELECT 
        TO_CHAR(
            INTERVAL '1 hour' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)) +
            INTERVAL '1 minute' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) % 60) +
            INTERVAL '1 second' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) % 60)),
            'HH24:MI:SS'
        ) AS count
    FROM 
        public.session_attendees AS sa
    JOIN 
        public.sessions AS s
    ON 
        sa.session_id = s.id
    WHERE 
        (CASE WHEN :userId IS NOT NULL THEN sa.mentee_id = :userId ELSE TRUE END)
        AND sa.joined_at IS NOT NULL 
        AND (CASE WHEN :start_date IS NOT NULL THEN s.start_date > :start_date ELSE TRUE END)
        AND (CASE WHEN :end_date IS NOT NULL THEN s.end_date < :end_date ELSE TRUE END)
        AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
        AND (
            CASE 
                WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE')
                WHEN :session_type = 'Public' THEN s.type = 'PUBLIC'
                WHEN :session_type = 'Private' THEN s.type = 'PRIVATE'
                ELSE TRUE
            END
        );`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'split_of_sessions_enrolled_and_attended_by_user',
				query: `SELECT 
                :start_date AS startDate,
                :end_date AS endDate,
                -- Count sessions based on the session_type condition
                COUNT(CASE 
                        WHEN sa.type = 'ENROLLED' 
                            AND (
                                :session_type = 'All' 
                                OR ( :session_type = 'Public' AND s.type = 'PUBLIC' ) 
                                OR ( :session_type = 'Private' AND s.type = 'PRIVATE' )
                            )
                        THEN 1 
                    END) AS session_enrolled,
        
                COUNT(CASE 
                        WHEN sa.joined_at IS NOT NULL
                            AND (
                                :session_type = 'All' 
                                OR ( :session_type = 'Public' AND s.type = 'PUBLIC' ) 
                                OR ( :session_type = 'Private' AND s.type = 'PRIVATE' )
                            )
                        THEN 1 
                    END) AS session_attended
            FROM public.session_attendees AS sa
            JOIN public.sessions AS s
            ON sa.session_id = s.id
            WHERE 
            (CASE WHEN :userId IS NOT NULL THEN sa.mentee_id = :userId ELSE TRUE END)
            AND (CASE WHEN :start_date IS NOT NULL THEN s.start_date > :start_date ELSE TRUE END)
            AND (CASE WHEN :end_date IS NOT NULL THEN s.end_date < :end_date ELSE TRUE END)
            AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END);`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'mentee_session_details',
				query: `SELECT 
                s.title AS "sessions_title",
                ue.name AS "sessions_created_by",
                s.mentor_name AS "mentor_name",
                TO_TIMESTAMP(s.start_date)::DATE AS "date_of_session", 
                s.type AS "session_type",
                ARRAY_TO_STRING(s.categories, ', ') AS "categories", -- Converts array to a comma-separated string
                ARRAY_TO_STRING(s.recommended_for, ', ') AS "recommended_for",
                CASE 
                    WHEN sa.joined_at IS NOT NULL THEN 'Yes'
                    ELSE 'No'
                END AS "session_attended",
                ROUND(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60) AS "duration_of_sessions_attended_in_minutes"
            FROM public.session_attendees AS sa
            JOIN public.sessions AS s ON sa.session_id = s.id
            LEFT JOIN public.user_extensions AS ue ON s.created_by = ue.user_id 
            WHERE 
                -- Filter by mentee ID if provided
                (sa.mentee_id = :userId OR :userId IS NULL) 
                -- Filter by start date if provided
                AND (s.start_date > :start_date OR :start_date IS NULL)
                -- Filter by end date if provided
                AND (s.end_date < :end_date OR :end_date IS NULL)
                -- Filter by categories if provided
                AND (:entities_value = ANY(s.categories) OR :entities_value IS NULL)
                -- Filter by session type
                AND (
                    :session_type = 'All' AND s.type IN ('PUBLIC', 'PRIVATE')
                    OR :session_type = 'Public' AND s.type = 'PUBLIC'
                    OR :session_type = 'Private' AND s.type = 'PRIVATE'
                )
                -- Filter by a specific column and value
                AND (:filter_column IS NULL OR 
                (
                    (:filter_column = 'sessions_title' AND s.title = :filter_value)
                    OR (:filter_column = 'sessions_created_by' AND ue.name = :filter_value)
                    OR (:filter_column = 'mentor_name' AND s.mentor_name = :filter_value)
                    OR (:filter_column = 'date_of_session' AND TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD') = :filter_value)
                    OR (:filter_column = 'session_type' AND s.type = :filter_value)
                    OR (:filter_column = 'categories' AND ARRAY_TO_STRING(s.categories, ', ') = :filter_value)
                    OR (:filter_column = 'recommended_for' AND ARRAY_TO_STRING(s.recommended_for, ', ') = :filter_value)
                    OR (:filter_column = 'session_attended' AND 
                        ((:filter_value = 'Yes' AND sa.joined_at IS NOT NULL) OR (:filter_value = 'No' AND sa.joined_at IS NULL)))
                )
            )
                -- Dynamic search for specific columns
                AND (:search_column IS NULL OR 
                (
                    LENGTH(:search_value) >= 1 AND 
                    (
                        (:search_column = 'sessions_title' AND s.title ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'sessions_created_by' AND ue.name ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'mentor_name' AND s.mentor_name ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'date_of_session' AND TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD') ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'session_type' AND s.type ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'categories' AND ARRAY_TO_STRING(s.categories, ', ') ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'recommended_for' AND ARRAY_TO_STRING(s.recommended_for, ', ') ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'duration_of_sessions_attended' AND 
                            ROUND(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60)::TEXT ILIKE '%' || :search_value || '%')
                        OR (:search_column = 'session_attended' AND 
                            ((:search_value = 'Yes' AND sa.joined_at IS NOT NULL) OR (:search_value = 'No' AND sa.joined_at IS NULL))
                        )
                    )
                )
            )
            ORDER BY
                -- Ordering logic based on column priority
                CASE 
                    WHEN :sort_column = 'sessions_title' THEN s.title
                    WHEN :sort_column = 'sessions_created_by' THEN ue.name
                    WHEN :sort_column = 'mentor_name' THEN s.mentor_name
                    WHEN :sort_column = 'duration_of_sessions_attended' THEN 
                        ROUND(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60)::TEXT
                    WHEN :sort_column = 'session_type' THEN s.type
                    WHEN :sort_column = 'session_attended' THEN 
                        CASE 
                            WHEN sa.joined_at IS NOT NULL THEN 'Yes'
                            ELSE 'No'
                        END
                    WHEN :sort_column = 'categories' THEN ARRAY_TO_STRING(s.categories, ', ') 
                    WHEN :sort_column = 'recommended_for' THEN ARRAY_TO_STRING(s.recommended_for, ', ')
                    WHEN :sort_column = 'date_of_session' THEN TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD')
                    ELSE NULL
                END :sort_type NULLS LAST
            LIMIT :limit OFFSET :offset;
            `,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'total_number_of_sessions_conducted',
				query: `SELECT 
        COUNT(*) AS count
    FROM 
        public.session_ownerships AS so
    JOIN 
        public.sessions AS s
    ON 
        so.session_id = s.id
    WHERE 
        (:userId IS NOT NULL AND so.user_id = :userId)
        AND ('MENTOR' IS NULL OR so.type = 'MENTOR')
        AND s.status = 'COMPLETED'
        AND (:start_date IS NOT NULL AND s.start_date > :start_date)
        AND (:end_date IS NOT NULL AND s.end_date < :end_date)
        AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
        AND (
            CASE 
                WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE') 
                WHEN :session_type = 'Public' THEN s.type = 'PUBLIC' 
                WHEN :session_type = 'Private' THEN s.type = 'PRIVATE'
                ELSE TRUE
            END
        );`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'total_hours_of_mentoring_conducted',
				query: `SELECT 
        TO_CHAR(
            INTERVAL '1 hour' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)) +
            INTERVAL '1 minute' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) % 60) +
            INTERVAL '1 second' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) % 60)),
            'HH24:MI:SS'
        ) AS count
    FROM 
        public.session_ownerships AS so
    JOIN 
        public.sessions AS s
    ON 
        so.session_id = s.id
    WHERE 
    (:userId IS NOT NULL AND so.user_id = :userId)
    AND ('MENTOR' IS NULL OR so.type = 'MENTOR')
    AND s.status = 'COMPLETED'
    AND (:start_date IS NOT NULL AND s.start_date > :start_date)
    AND (:end_date IS NOT NULL AND s.end_date < :end_date)
    AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
    AND (
        CASE 
            WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE') 
            WHEN :session_type = 'Public' THEN s.type = 'PUBLIC' 
            WHEN :session_type = 'Private' THEN s.type = 'PRIVATE'
            ELSE TRUE
        END
        );`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'split_of_sessions_conducted',
				query: `SELECT 
                :start_date AS startDate,
                :end_date AS endDate,
            
                -- Count session_created (sum of public and private created sessions)
                COUNT(CASE 
                        WHEN so.type = 'CREATOR' 
                            AND (
                                :session_type = 'All' 
                                OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                                OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                            )
                        THEN 1
                    END) AS session_created,
            
                -- Count sessions_conducted (sum of public and private conducted sessions)
                COUNT(CASE 
                        WHEN so.type = 'MENTOR' 
                            AND s.status = 'COMPLETED'
                            AND (
                                :session_type = 'All' 
                                OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                                OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                            )
                        THEN 1
                    END) AS sessions_conducted
            FROM 
                public.session_ownerships AS so
            JOIN 
                public.sessions AS s 
                ON so.session_id = s.id
            WHERE 
                (:userId IS NOT NULL AND so.user_id = :userId OR :userId IS NULL)
                AND (s.start_date > :start_date OR :start_date IS NULL)
                AND (s.end_date < :end_date OR :end_date IS NULL)
                AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
                AND (
                    :session_type = 'All' 
                    OR :session_type = 'Public' 
                    OR :session_type = 'Private'
                );            
            `,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'mentoring_session_details',
				query: `SELECT 
                s.title AS "sessions_title",
                ue.name AS "sessions_created_by",
                s.seats_limit - s.seats_remaining AS "number_of_mentees",
                TO_TIMESTAMP(s.start_date)::DATE AS "date_of_session",
                s.type AS "session_type",
                CASE 
                    WHEN s.started_at IS NOT NULL THEN 'Yes'
                    ELSE 'No'
                END AS "session_conducted",
                ROUND(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60) AS "duration_of_sessions_attended_in_minutes",
                f.response AS "mentor_rating"
            FROM public.session_attendees AS sa
            JOIN public.sessions AS s ON sa.session_id = s.id
            LEFT JOIN public.user_extensions AS ue ON s.created_by = ue.user_id
            LEFT JOIN public.feedbacks AS f ON s.id = f.session_id
            WHERE 
                (CASE WHEN :userId IS NOT NULL THEN sa.mentee_id = :userId ELSE TRUE END)
                AND (CASE WHEN :start_date IS NOT NULL THEN s.start_date > :start_date ELSE TRUE END)
                AND (CASE WHEN :end_date IS NOT NULL THEN s.end_date < :end_date ELSE TRUE END)
                AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
                AND (
                    CASE 
                        WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE')
                        WHEN :session_type = 'PUBLIC' THEN s.type = 'PUBLIC'
                        WHEN :session_type = 'PRIVATE' THEN s.type = 'PRIVATE'
                        ELSE TRUE
                    END
                )
AND (
    CASE WHEN :filter_column IS NOT NULL THEN
        (
             (:filter_column = 'sessions_created_by' AND ue.name = :filter_value)
            OR (:filter_column = 'mentor_name' AND s.mentor_name = :filter_value)
            OR (:filter_column = 'date_of_session' AND TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD') = :filter_value)
            OR (:filter_column = 'session_type' AND s.type = :filter_value)
            OR (:filter_column = 'duration_of_sessions_attended' AND ROUND(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60) = :filter_value)
            OR (:filter_column = 'mentor_rating' AND f.response = :filter_value)
            OR (:filter_column = 'number_of_mentees' AND s.seats_limit - s.seats_remaining = :filter_value)
            OR (:filter_column = 'session_conducted' AND 
                (
                    (:filter_value = 'Yes' AND s.started_at IS NOT NULL) 
                    OR (:filter_value = 'No' AND s.started_at IS NULL)
                )
            )
        )
    ELSE TRUE 
    END
)
                AND (
                    CASE 
                        WHEN :search_column IS NOT NULL AND :search_value IS NOT NULL AND LENGTH(:search_value) >= 1 THEN
                            CAST(CASE
                                WHEN :search_column = 'sessions_title' THEN s.title
                                WHEN :search_column = 'sessions_created_by' THEN ue.name
                                WHEN :search_column = 'mentor_name' THEN s.mentor_name
                                WHEN :search_column = 'date_of_session' THEN TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD')
                                WHEN :search_column = 'session_type' THEN s.type
                                WHEN :search_column = 'duration_of_sessions_attended' THEN
                                    ROUND(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60)::TEXT
                                WHEN :search_column = 'mentor_rating' THEN f.response::TEXT
                                WHEN :search_column = 'session_conducted' THEN 
                                CASE 
                                    WHEN :search_value = 'Yes' AND sa.joined_at IS NOT NULL THEN 'Yes'
                                    WHEN :search_value = 'No' AND sa.joined_at IS NULL THEN 'No'
                                    ELSE NULL
                                END
                            END AS TEXT) ILIKE '%' || :search_value || '%'
                        ELSE TRUE -- Default behavior when search is not valid
                    END
                )
            ORDER BY
                CASE 
                    WHEN :sort_column = 'sessions_title' THEN s.title
                    WHEN :sort_column = 'sessions_created_by' THEN ue.name
                    WHEN :sort_column = 'mentor_name' THEN s.mentor_name
                    WHEN :sort_column = 'date_of_session' THEN TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD')
                    WHEN :sort_column = 'session_type' THEN s.type
                    WHEN :sort_column = 'duration_of_sessions_attended' THEN 
                        ROUND(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60)::TEXT
                    WHEN :sort_column = 'mentor_rating' THEN f.response::TEXT
                    WHEN :sort_column = 'session_conducted' THEN 
                        CASE 
                            WHEN s.started_at IS NOT NULL THEN 'Yes'
                            ELSE 'No'
                        END
                    ELSE NULL
                END :sort_type NULLS LAST
            LIMIT :limit OFFSET :offset;`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'total_hours_of_sessions_created_by_session_manager',
				query: `SELECT 
                TO_CHAR(
                    TO_TIMESTAMP(SUM(s.end_date - s.start_date)) - TO_TIMESTAMP(0), 
                    'HH24:MI:SS'
                ) AS count
            FROM 
                public.session_ownerships AS so
            JOIN 
                public.sessions AS s
            ON 
                so.session_id = s.id
            WHERE 
                (:userId IS NOT NULL AND so.user_id = :userId) 
                AND ('CREATOR' IS NULL OR so.type = 'CREATOR') 
                AND (:start_date IS NOT NULL AND s.start_date > :start_date) 
                AND (:end_date IS NOT NULL AND s.end_date < :end_date) 
                AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
                AND (
                    CASE 
                        WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE') 
                        WHEN :session_type = 'Public' THEN s.type = 'PUBLIC' 
                        WHEN :session_type = 'Private' THEN s.type = 'PRIVATE' 
                        ELSE TRUE
                    END
                );`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'total_number_of_hours_of_mentoring_conducted',
				query: `SELECT 
                TO_CHAR(
                    INTERVAL '1 hour' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)) +
                    INTERVAL '1 minute' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) % 60) +
                    INTERVAL '1 second' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) % 60)),
                    'HH24:MI:SS'
                ) AS count
            FROM 
                public.session_ownerships AS so
            JOIN 
                public.sessions AS s
            ON 
                so.session_id = s.id
            WHERE 
            (:userId IS NOT NULL AND so.user_id = :userId)
            AND ('MENTOR' IS NULL OR so.type = 'MENTOR')
            AND s.status = 'COMPLETED'
            AND (:start_date IS NOT NULL AND s.start_date > :start_date)
            AND (:end_date IS NOT NULL AND s.end_date < :end_date)
            AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
            AND (
                CASE 
                    WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE') 
                    WHEN :session_type = 'Public' THEN s.type = 'PUBLIC' 
                    WHEN :session_type = 'Private' THEN s.type = 'PRIVATE'
                    ELSE TRUE
                END
                );`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'split_of_sessions_created_and_conducted',
				query: `SELECT
                :start_date AS startDate,
                :end_date AS endDate,
            
                -- Count session_created (sum of public and private created sessions based on session_type)
                COUNT(*) FILTER (WHERE so.type = 'CREATOR' 
                    AND (
                        :session_type = 'All' 
                        OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                        OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                    )
                ) AS session_created,
            
                -- Count sessions_conducted (sum of public and private conducted sessions based on session_type)
                COUNT(*) FILTER (WHERE so.type = 'MENTOR' 
                    AND s.status = 'COMPLETED'
                    AND (
                        :session_type = 'All' 
                        OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                        OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                    )
                ) AS sessions_conducted
            FROM
                public.session_ownerships AS so
            JOIN
                public.sessions AS s ON so.session_id = s.id
            WHERE
                (:userId IS NOT NULL AND so.user_id = :userId OR :userId IS NULL)
                AND (:start_date IS NOT NULL AND s.start_date > :start_date OR :start_date IS NULL)
                AND (:end_date IS NOT NULL AND s.end_date < :end_date OR :end_date IS NULL)
                AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
                AND (
                    :session_type = 'All' 
                    OR :session_type = 'Public' 
                    OR :session_type = 'Private'
                );
            `,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'session_manger_session_details',
				query: `SELECT 
                subquery.mentor_name AS "mentor_name",
                subquery."number_of_mentoring_sessions",
                subquery."hours_of_mentoring_sessions",
                subquery."avg_mentor_rating"
            FROM (
                SELECT 
                    s.mentor_name,
                    COUNT(*) OVER (PARTITION BY so.user_id) AS "number_of_mentoring_sessions",
                    CASE 
                        -- If the total hours is a whole number, remove the decimal (e.g., 1.0 -> 1)
                        WHEN ROUND(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))) / 3600.0) = FLOOR(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))) / 3600.0)
                        THEN CAST(FLOOR(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))) / 3600.0) AS TEXT)  -- Removes .0 for whole numbers
                        ELSE CAST(ROUND(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at))) / 3600.0, 1) AS TEXT)  -- Keeps decimals for non-whole numbers
                    END AS "hours_of_mentoring_sessions",
                    COALESCE(CAST(ue.rating ->> 'average' AS NUMERIC), 0) AS "avg_mentor_rating" 
                FROM 
                    public.sessions AS s
                JOIN 
                    public.session_ownerships AS so
                ON 
                    s.id = so.session_id
                LEFT JOIN 
                    public.user_extensions AS ue
                ON 
                    so.user_id = ue.user_id -- Join user_extension based on user_id
                WHERE 
                    s.created_by = :userId -- Replace with dynamic session manager's ID
                    AND so.type = 'MENTOR' -- Filter for sessions where ownership is 'MENTOR' (individual mentor)
                    AND so.user_id IS NOT NULL -- Ensure that the mentor has a valid ID
                    AND s.started_at IS NOT NULL
                    AND s.completed_at IS NOT NULL
                    AND s.start_date > :start_date -- Optional: Replace with dynamic start date in epoch format
                    AND s.end_date < :end_date -- Optional: Replace with dynamic end date in epoch format
                    AND (:entities_value IS NULL OR s.categories = :entities_value)
                    AND (
                    CASE 
                        WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE')
                        WHEN :session_type = 'PUBLIC' THEN s.type = 'PUBLIC'
                        WHEN :session_type = 'PRIVATE' THEN s.type = 'PRIVATE'
                        ELSE TRUE
                    END
                )
                GROUP BY 
                    so.user_id, 
                    s.created_by, 
                    s.mentor_name, 
                    COALESCE(CAST(ue.rating ->> 'average' AS NUMERIC), 0)
            ) AS subquery
            WHERE 
                (
                    :filter_column IS NULL OR 
                    (
                        LENGTH(:filter_value) >= 1 AND 
                        CAST(
                            CASE 
                                WHEN :filter_column = 'mentor_name' THEN CAST(subquery."mentor_name" AS TEXT)
                                WHEN :filter_column = 'number_of_mentoring_sessions' THEN CAST(subquery."number_of_mentoring_sessions" AS TEXT)
                                WHEN :filter_column = 'avg_mentor_rating' THEN CAST(subquery."avg_mentor_rating" AS TEXT)
                                WHEN :filter_column = 'hours_of_mentoring_sessions' THEN subquery."hours_of_mentoring_sessions"
                            END AS TEXT
                        ) = :filter_value -- Dynamic filter based on the parameter (e.g., '0.6')
                    )
                )
                AND (
                    :search_column IS NULL OR 
                    (
                        LENGTH(:search_value) >= 1 AND 
                        CAST(
                            CASE 
                                WHEN :search_column = 'mentor_name' THEN CAST(subquery."mentor_name" AS TEXT)
                                WHEN :search_column = 'number_of_mentoring_sessions' THEN CAST(subquery."number_of_mentoring_sessions" AS TEXT)
                                WHEN :search_column = 'avg_mentor_rating' THEN CAST(subquery."avg_mentor_rating" AS TEXT)
                                WHEN :search_column = 'hours_of_mentoring_sessions' THEN subquery."hours_of_mentoring_sessions"
                            END AS TEXT
                        ) = :search_value -- Dynamic filter based on the parameter (e.g., '0.6')
                    )
                )
            ORDER BY 
                CASE 
                    WHEN :sort_column = 'mentor_name' THEN CAST(subquery."mentor_name" AS TEXT)
                    WHEN :sort_column = 'number_of_mentoring_sessions' THEN CAST(subquery."number_of_mentoring_sessions" AS TEXT)
                    WHEN :sort_column = 'avg_mentor_rating' THEN CAST(subquery."avg_mentor_rating" AS TEXT)
                    WHEN :sort_column = 'hours_of_mentoring_sessions' THEN subquery."hours_of_mentoring_sessions"
                    ELSE CAST(subquery."number_of_mentoring_sessions" AS TEXT)
                END :sort_type
            LIMIT :limit OFFSET :offset;
            `,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
		])
	},

	async down(queryInterface, Sequelize) {
		// Revert the inserted data
		await queryInterface.bulkDelete('report_queries', { report_code: 'session_created' })
	},
}
