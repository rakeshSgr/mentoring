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
        COUNT(CASE WHEN sa.type = 'ENROLLED' AND s.type = 'PUBLIC' THEN 1 END) AS total_sessions_enrolled_public,
        COUNT(CASE WHEN sa.type = 'ENROLLED' AND s.type = 'PRIVATE' THEN 1 END) AS total_sessions_enrolled_private,
        COUNT(CASE WHEN sa.joined_at IS NOT NULL AND s.type = 'PUBLIC' THEN 1 END) AS total_sessions_attended_public,
        COUNT(CASE WHEN sa.joined_at IS NOT NULL AND s.type = 'PRIVATE' THEN 1 END) AS total_sessions_attended_private
    FROM public.session_attendees AS sa
    JOIN public.sessions AS s
    ON sa.session_id = s.id
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
				report_code: 'mentee_session_details',
				query: `SELECT 
        s.title AS "Session Title",
        ue.name AS "Sessions Created By",
        s.mentor_name AS "Mentor Name",
        TO_TIMESTAMP(s.start_date)::DATE AS "Date of Session", 
        s.type AS "Session Type",
        s.categories AS "Category",
        CASE 
                WHEN sa.joined_at IS NOT NULL THEN 'Yes'
                    ELSE 'No'
                END AS "Session Attended",
        TO_CHAR(
            INTERVAL '1 second' * EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))),
            'HH24:MI:SS'
        ) AS "Duration of Sessions Attended in minutes (at setup time)"
    FROM public.session_attendees AS sa
    JOIN public.sessions AS s ON sa.session_id = s.id
    LEFT JOIN public.user_extensions AS ue ON s.created_by = ue.user_id 
    WHERE 
        (CASE WHEN :userId IS NOT NULL THEN sa.mentee_id = :userId ELSE TRUE END)
        AND (CASE WHEN :start_date IS NOT NULL THEN s.start_date > :start_date ELSE TRUE END)
        AND (CASE WHEN :end_date IS NOT NULL THEN s.end_date < :end_date ELSE TRUE END)
        AND (CASE 
        WHEN :entities_value IS NOT NULL THEN 
            (s.categories = :entities_value OR s.categories IS NULL)
        ELSE TRUE 
    END)
        AND (
            CASE 
                WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE')
                WHEN :session_type = 'PUBLIC' THEN s.type = 'PUBLIC'
                WHEN :session_type = 'PRIVATE' THEN s.type = 'PRIVATE'
                ELSE TRUE
            END
        )
        AND (
            CASE 
                WHEN :search_column IS NOT NULL AND :search_value IS NOT NULL AND LENGTH(:search_value) >= 3 THEN
                    CAST(CASE 
                        WHEN :search_column = 'session_title' THEN s.title
                        WHEN :search_column = 'sessions_created_by' THEN ue.name
                        WHEN :search_column = 'mentor_name' THEN s.mentor_name
                        WHEN :search_column = 'date_of_session' THEN TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD')
                        WHEN :search_column = 'session_type' THEN s.type
                        WHEN :search_column = 'category' THEN 
                            CASE 
                                WHEN :search_value = ANY(s.categories) THEN :search_value
                                ELSE NULL
                            END
                        WHEN :search_column = 'duration_of_sessions_attended' THEN TO_CHAR(
                            INTERVAL '1 second' * EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))),
                            'HH24:MI:SS'
                        )
                    END AS TEXT) ILIKE '%' || :search_value || '%'
                ELSE TRUE -- Default behavior when search is not valid
            END
        )
        AND (
            CASE 
                WHEN :search_column = 'Session Attended' AND :search_value = 'Yes' THEN sa.joined_at IS NOT NULL
                WHEN :search_column = 'Session Attended' AND :search_value = 'No' THEN sa.joined_at IS NULL
                ELSE TRUE 
            END
        )
    ORDER BY
        CASE 
            WHEN :sort_column = 'session_title' THEN s.title
            WHEN :sort_column = 'sessions_created_by' THEN ue.name -- Sort by creator_name
            WHEN :sort_column = 'mentor_name' THEN s.mentor_name
            ELSE NULL
        END :sort_type NULLS LAST,
    
        CASE 
            WHEN :sort_column = 'date_of_session' THEN TO_TIMESTAMP(s.start_date)::DATE
            ELSE NULL
        END :sort_type NULLS LAST,
    
        CASE 
            WHEN :sort_column = 'duration_of_sessions_attended' THEN 
                TO_CHAR(
                    INTERVAL '1 second' * EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))),
                    'HH24:MI:SS'
                )
            ELSE NULL
        END :sort_type NULLS LAST,
    
        CASE 
            WHEN :sort_column = 'session_type' THEN s.type
            ELSE NULL
        END :sort_type NULLS LAST,
    
        CASE 
            WHEN :sort_column = 'category' THEN s.categories
            ELSE NULL
        END :sort_type NULLS LAST
        LIMIT :limit OFFSET :offset;`,
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
                COUNT(*) FILTER (WHERE so.type = 'CREATOR' AND s.type = 'PUBLIC') AS public_sessions_created,
                COUNT(*) FILTER (WHERE so.type = 'CREATOR' AND s.type = 'PRIVATE') AS private_sessions_created,
                COUNT(*) FILTER (WHERE so.type = 'MENTOR' AND s.type = 'PUBLIC' AND s.status = 'COMPLETED') AS public_sessions_conducted,
                COUNT(*) FILTER (WHERE so.type = 'MENTOR' AND s.type = 'PRIVATE' AND s.status = 'COMPLETED') AS private_sessions_conducted
            FROM
                public.session_ownerships AS so
            JOIN
                public.sessions AS s ON so.session_id = s.id
            WHERE
                (:userId IS NOT NULL AND so.user_id = :userId)
                AND (:start_date IS NOT NULL AND s.start_date > :start_date)
                AND (:end_date IS NOT NULL AND s.end_date < :end_date)
                AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
                AND (so.type IN ('CREATOR', 'MENTOR')) --Added this to only include creator and mentor types
                AND (CASE
                        WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE')
                        WHEN :session_type = 'Public' THEN s.type = 'PUBLIC'
                        WHEN :session_type = 'Private' THEN s.type = 'PRIVATE'
                        ELSE TRUE
                    END);`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'mentoring_session_details',
				query: `SELECT 
                s.title AS "Sessions Title",
                ue.name AS "Sessions Created By",
                s.seats_limit - s.seats_remaining AS "Number of Mentees",
                TO_TIMESTAMP(s.start_date)::DATE AS "Date of Session",
                s.type AS "Session Type",
                CASE 
                    WHEN s.started_at IS NOT NULL THEN 'Yes'
                    ELSE 'No'
                END AS "Session Conducted",
                TO_CHAR(
                    INTERVAL '1 second' * EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))),
                    'HH24:MI:SS'
                ) AS "Duration of Sessions Attended - min (at setup time)"
            FROM public.session_attendees AS sa
            JOIN public.sessions AS s ON sa.session_id = s.id
            LEFT JOIN public.user_extensions AS ue ON s.created_by = ue.user_id
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
                    CASE 
                        WHEN :search_column IS NOT NULL AND :search_value IS NOT NULL AND LENGTH(:search_value) >= 3 THEN
                            CAST(CASE 
                                WHEN :search_column = 'session_title' THEN s.title
                                WHEN :search_column = 'sessions_created_by' THEN ue.name
                                WHEN :search_column = 'mentor_name' THEN s.mentor_name
                                WHEN :search_column = 'date_of_session' THEN TO_CHAR(TO_TIMESTAMP(s.start_date)::DATE, 'YYYY-MM-DD')
                                WHEN :search_column = 'session_type' THEN s.type
                                WHEN :search_column = 'category' THEN 
                                CASE 
                                WHEN :search_value = ANY(s.categories) THEN :search_value
                                ELSE NULL
                                END
                                WHEN :search_column = 'duration_of_sessions_attended' THEN TO_CHAR(
                                    INTERVAL '1 second' * EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))),
                                    'HH24:MI:SS'
                                )
                            END AS TEXT) ILIKE '%' || :search_value || '%'
                        ELSE TRUE -- Default behavior when search is not valid
                    END
                )
AND (
        CASE 
            WHEN :search_column = 'Session Conducted' AND :search_value = 'Yes' THEN s.started_at IS NOT NULL
            WHEN :search_column = 'Session Conducted' AND :search_value = 'No' THEN s.started_at IS NULL
            ELSE TRUE -- Default behavior for other cases
        END
    )
            ORDER BY
                CASE 
                    WHEN :sort_column = 'session_title' THEN s.title
                    WHEN :sort_column = 'sessions_created_by' THEN ue.name 
                    WHEN :sort_column = 'mentor_name' THEN s.mentor_name
                    ELSE NULL
                END :sort_type NULLS LAST,
                CASE 
                    WHEN :sort_column = 'date_of_session' THEN TO_TIMESTAMP(s.start_date)::DATE
                    ELSE NULL
                END :sort_type NULLS LAST,
                CASE 
                    WHEN :sort_column = 'duration_of_sessions_attended' THEN 
                        EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60
                    ELSE NULL
                END :sort_type NULLS LAST,
                CASE 
                    WHEN :sort_column = 'session_type' THEN s.type
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
                COUNT(*) FILTER (WHERE so.type = 'CREATOR' AND s.type = 'PUBLIC') AS public_sessions_created,
                COUNT(*) FILTER (WHERE so.type = 'CREATOR' AND s.type = 'PRIVATE') AS private_sessions_created,
                COUNT(*) FILTER (WHERE so.type = 'MENTOR' AND s.type = 'PUBLIC' AND s.status = 'COMPLETED') AS public_sessions_conducted,
                COUNT(*) FILTER (WHERE so.type = 'MENTOR' AND s.type = 'PRIVATE' AND s.status = 'COMPLETED') AS private_sessions_conducted
            FROM
                public.session_ownerships AS so
            JOIN
                public.sessions AS s ON so.session_id = s.id
            WHERE
                (:userId IS NOT NULL AND so.user_id = :userId)
                AND (:start_date IS NOT NULL AND s.start_date > :start_date)
                AND (:end_date IS NOT NULL AND s.end_date < :end_date)
                AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
                AND (so.type IN ('CREATOR', 'MENTOR')) --Added this to only include creator and mentor types
                AND (CASE
                        WHEN :session_type = 'All' THEN s.type IN ('PUBLIC', 'PRIVATE')
                        WHEN :session_type = 'Public' THEN s.type = 'PUBLIC'
                        WHEN :session_type = 'Private' THEN s.type = 'PRIVATE'
                        ELSE TRUE
                    END);`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'session_manger_session_details',
				query: '',
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
