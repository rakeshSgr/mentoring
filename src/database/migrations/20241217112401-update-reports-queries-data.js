'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		// Insert data into the report_queries table
		await queryInterface.bulkInsert('report_queries', [
			{
				report_code: 'total_number_of_sessions_attended',
				query: `SELECT 
                COUNT(*) AS total_count,
            CASE 
                WHEN 'All' = 'All' THEN 
                    COUNT(*) FILTER (WHERE s.type = 'PUBLIC') -- Count for Public sessions
                ELSE NULL 
            END AS public_count,
            CASE 
                WHEN 'All' = 'All' THEN 
                    COUNT(*) FILTER (WHERE s.type = 'PRIVATE') -- Count for Private sessions
                ELSE NULL 
            END AS private_count
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
                INTERVAL '1 hour' * FLOOR(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) / 3600)) +
                INTERVAL '1 minute' * FLOOR(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) / 60) % 60) +
                INTERVAL '1 second' * FLOOR(SUM(EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) % 60)),
                'HH24:MI:SS'
            ) AS total_hours, -- Total duration of all sessions
            TO_CHAR(
                INTERVAL '1 hour' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) / 3600 ELSE 0 END)) +
                INTERVAL '1 minute' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) / 60 ELSE 0 END) % 60) +
                INTERVAL '1 second' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) % 60 ELSE 0 END)),
                'HH24:MI:SS'
            ) AS public_hours, -- Total duration of public sessions
            TO_CHAR(
                INTERVAL '1 hour' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) / 3600 ELSE 0 END)) +
                INTERVAL '1 minute' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) / 60 ELSE 0 END) % 60) +
                INTERVAL '1 second' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (s.completed_at - s.started_at)) % 60 ELSE 0 END)),
                'HH24:MI:SS'
            ) AS private_hours
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
                -- Enrolled session counts
            COUNT(CASE 
                    WHEN sa.type = 'ENROLLED' 
                        AND (
                            :session_type = 'All' 
                            OR ( :session_type = 'Public' AND s.type = 'PUBLIC' ) 
                        )
                    THEN 1 
                END) AS public_session_enrolled,
            COUNT(CASE 
                    WHEN sa.type = 'ENROLLED' 
                        AND (
                            :session_type = 'All' 
                            OR ( :session_type = 'Private' AND s.type = 'PRIVATE' ) 
                        )
                    THEN 1 
                END) AS private_session_enrolled,
        
            -- Attended session counts
            COUNT(CASE 
                    WHEN sa.joined_at IS NOT NULL
                        AND (
                            :session_type = 'All' 
                            OR ( :session_type = 'Public' AND s.type = 'PUBLIC' ) 
                        )
                    THEN 1 
                END) AS public_session_attended,
            COUNT(CASE 
                    WHEN sa.joined_at IS NOT NULL
                        AND (
                            :session_type = 'All' 
                            OR ( :session_type = 'Private' AND s.type = 'PRIVATE' ) 
                        )
                    THEN 1 
                END) AS private_session_attended
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
            CASE WHEN sa.joined_at IS NOT NULL THEN 'Yes' ELSE 'No' END AS "session_attended",
            ROUND(EXTRACT(EPOCH FROM(TO_TIMESTAMP(s.end_date)-TO_TIMESTAMP(s.start_date)))/60) AS "duration_of_sessions_attended_in_minutes"
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
            ;
            `,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'total_number_of_sessions_conducted',
				query: `SELECT 
                COUNT(*) AS total_count, -- Total count of sessions (all types)
        
            -- Public count: Calculate only when the session type is 'All' or 'Public'
            COUNT(CASE 
                    WHEN s.type = 'PUBLIC' AND 
                        (:session_type = 'All' OR :session_type = 'Public') 
                    THEN 1 
                END) AS public_count,
        
            -- Private count: Calculate only when the session type is 'All' or 'Private'
            COUNT(CASE 
                    WHEN s.type = 'PRIVATE' AND 
                        (:session_type = 'All' OR :session_type = 'Private') 
                    THEN 1 
                END) AS private_count
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
                -- Total duration (sum of both public and private sessions)
                TO_CHAR(
                    INTERVAL '1 hour' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)) +
                    INTERVAL '1 minute' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) % 60) +
                    INTERVAL '1 second' * FLOOR(SUM(EXTRACT(EPOCH FROM (completed_at - started_at)) % 60)),
                    'HH24:MI:SS'
                ) AS total_hours,
            
                -- Duration for public sessions
                TO_CHAR(
                    INTERVAL '1 hour' * FLOOR(SUM(
                        CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END
                    ) / 3600) +
                    INTERVAL '1 minute' * FLOOR(SUM(
                        CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END
                    ) / 60 % 60) +
                    INTERVAL '1 second' * FLOOR(SUM(
                        CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END
                    ) % 60),
                    'HH24:MI:SS'
                ) AS public_hours,
            
                -- Duration for private sessions
                TO_CHAR(
                    INTERVAL '1 hour' * FLOOR(SUM(
                        CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END
                    ) / 3600) +
                    INTERVAL '1 minute' * FLOOR(SUM(
                        CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END
                    ) / 60 % 60) +
                    INTERVAL '1 second' * FLOOR(SUM(
                        CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END
                    ) % 60),
                    'HH24:MI:SS'
                ) AS private_hours
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
                );
            `,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'split_of_sessions_conducted',
				query: `SELECT 
                :start_date AS startDate,
                :end_date AS endDate,
            
                -- Total sessions created (reflects only private sessions if session_type is Private)
                COUNT(CASE 
                        WHEN so.type = 'CREATOR'
                            AND (
                                :session_type = 'All' 
                                OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                                OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                            )
                        THEN 1
                    END) AS total_sessions_created,
            
                -- Public sessions created (shows 0 if session_type is Private)
                COUNT(CASE 
                        WHEN so.type = 'CREATOR'
                            AND s.type = 'PUBLIC'
                            AND (:session_type = 'All' OR :session_type = 'Public')
                        THEN 1
                    END) AS public_sessions_created,
            
                -- Private sessions created (counts only private sessions)
                COUNT(CASE 
                        WHEN so.type = 'CREATOR'
                            AND s.type = 'PRIVATE'
                            AND (:session_type = 'All' OR :session_type = 'Private')
                        THEN 1
                    END) AS private_sessions_created,
            
                -- Total sessions conducted (reflects only private sessions if session_type is Private)
                COUNT(CASE 
                        WHEN so.type = 'MENTOR'
                            AND s.status = 'COMPLETED'
                            AND (
                                :session_type = 'All' 
                                OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                                OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                            )
                        THEN 1
                    END) AS total_sessions_conducted,
            
                -- Public sessions conducted (shows 0 if session_type is Private)
                COUNT(CASE 
                        WHEN so.type = 'MENTOR'
                            AND s.status = 'COMPLETED'
                            AND s.type = 'PUBLIC'
                            AND (:session_type = 'All' OR :session_type = 'Public')
                        THEN 1
                    END) AS public_sessions_conducted,
            
                -- Private sessions conducted (counts only private sessions)
                COUNT(CASE 
                        WHEN so.type = 'MENTOR'
                            AND s.status = 'COMPLETED'
                            AND s.type = 'PRIVATE'
                            AND (:session_type = 'All' OR :session_type = 'Private')
                        THEN 1
                    END) AS private_sessions_conducted
            
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
                s.seats_limit-s.seats_remaining AS "number_of_mentees",
                TO_TIMESTAMP(s.start_date)::DATE AS "date_of_session",
                s.type AS "session_type",
                CASE 
                    WHEN s.started_at IS NOT NULL THEN 'Yes'
                    ELSE 'No'
                END AS "session_conducted",
                ROUND(EXTRACT(EPOCH FROM(TO_TIMESTAMP(s.end_date)-TO_TIMESTAMP(s.start_date)))/60) AS "duration_of_sessions_attended_in_minutes",
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
;`,
				status: 'ACTIVE',
				created_at: Sequelize.literal('CURRENT_TIMESTAMP'),
				updated_at: Sequelize.literal('CURRENT_TIMESTAMP'),
			},
			{
				report_code: 'total_hours_of_sessions_created_by_session_manager',
				query: `SELECT 
                -- Total minutes for all sessions
                TO_CHAR(
                    INTERVAL '1 hour' * FLOOR(SUM(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60) / 60) +
                    INTERVAL '1 minute' * FLOOR(SUM(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60) % 60) +
                    INTERVAL '1 second' * FLOOR(SUM(EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60) % 60),
                    'HH24:MI:SS'
                ) AS total_hours,
                
                -- Total minutes for Public sessions
                TO_CHAR(
                    INTERVAL '1 hour' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60 ELSE 0 END) / 60) +
                    INTERVAL '1 minute' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60 ELSE 0 END) % 60) +
                    INTERVAL '1 second' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60 ELSE 0 END) % 60),
                    'HH24:MI:SS'
                ) AS total_public_hours,
                
                -- Total minutes for Private sessions
                TO_CHAR(
                    INTERVAL '1 hour' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60 ELSE 0 END) / 60) +
                    INTERVAL '1 minute' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60 ELSE 0 END) % 60) +
                    INTERVAL '1 second' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (TO_TIMESTAMP(s.end_date) - TO_TIMESTAMP(s.start_date))) / 60 ELSE 0 END) % 60),
                    'HH24:MI:SS'
                ) AS total_private_hours
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
                    ) AS total_hours,
                    
                    -- Total hours for Public sessions
                    TO_CHAR(
                        INTERVAL '1 hour' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END) / 3600) +
                        INTERVAL '1 minute' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END) / 60 % 60) +
                        INTERVAL '1 second' * FLOOR(SUM(CASE WHEN s.type = 'PUBLIC' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END) % 60),
                        'HH24:MI:SS'
                    ) AS public_hours,
                    
                    -- Total hours for Private sessions
                    TO_CHAR(
                        INTERVAL '1 hour' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END) / 3600) +
                        INTERVAL '1 minute' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END) / 60 % 60) +
                        INTERVAL '1 second' * FLOOR(SUM(CASE WHEN s.type = 'PRIVATE' THEN EXTRACT(EPOCH FROM (completed_at - started_at)) ELSE 0 END) % 60),
                        'HH24:MI:SS'
                    ) AS private_hours
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
                COUNT(*) FILTER (
                    WHERE so.type = 'CREATOR' 
                    AND (
                        :session_type = 'All' 
                        OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                        OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                    )
                ) AS session_created,
            
                -- Count sessions_conducted (sum of public and private conducted sessions based on session_type)
                COUNT(*) FILTER (
                    WHERE so.type = 'MENTOR' 
                    AND s.status = 'COMPLETED'
                    AND (
                        :session_type = 'All' 
                        OR (:session_type = 'Public' AND s.type = 'PUBLIC')
                        OR (:session_type = 'Private' AND s.type = 'PRIVATE')
                    )
                ) AS sessions_conducted,
            
                -- Total sessions conducted (all types combined)
                COUNT(*) FILTER (
                    WHERE so.type = 'MENTOR' 
                    AND s.status = 'COMPLETED'
                    AND (
                        :session_type = 'All' 
                        OR :session_type = 'Public' AND s.type = 'PUBLIC'
                        OR :session_type = 'Private' AND s.type = 'PRIVATE'
                    )
                ) AS total_sessions_conducted,
            
                -- Public sessions conducted
                COUNT(*) FILTER (
                    WHERE so.type = 'MENTOR' 
                    AND s.status = 'COMPLETED'
                    AND :session_type IN ('All', 'Public') 
                    AND s.type = 'PUBLIC'
                ) AS public_sessions_conducted,
            
                -- Private sessions conducted
                COUNT(*) FILTER (
                    WHERE so.type = 'MENTOR' 
                    AND s.status = 'COMPLETED'
                    AND :session_type IN ('All', 'Private') 
                    AND s.type = 'PRIVATE'
                ) AS private_sessions_conducted,
            
                -- Public sessions created
                COUNT(*) FILTER (
                    WHERE so.type = 'CREATOR' 
                    AND :session_type IN ('All', 'Public') 
                    AND s.type = 'PUBLIC'
                ) AS public_sessions_created,
            
                -- Private sessions created
                COUNT(*) FILTER (
                    WHERE so.type = 'CREATOR' 
                    AND :session_type IN ('All', 'Private') 
                    AND s.type = 'PRIVATE'
                ) AS private_sessions_created
            FROM
                public.session_ownerships AS so
            JOIN
                public.sessions AS s ON so.session_id = s.id
            WHERE
                (:userId IS NOT NULL AND so.user_id = :userId OR :userId IS NULL)
                AND (:start_date IS NOT NULL AND s.start_date > :start_date OR :start_date IS NULL)
                AND (:end_date IS NOT NULL AND s.end_date < :end_date OR :end_date IS NULL)
                AND (CASE WHEN :entities_value IS NOT NULL THEN s.categories = :entities_value ELSE TRUE END)
                AND (so.type IN ('CREATOR', 'MENTOR'))
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
                    CASE WHEN ROUND(SUM(EXTRACT(EPOCH FROM(s.completed_at-s.started_at)))/3600.0)=FLOOR(SUM(EXTRACT(EPOCH FROM(s.completed_at-s.started_at)))/3600.0)
                        THEN CAST(FLOOR(SUM(EXTRACT(EPOCH FROM(s.completed_at-s.started_at)))/3600.0) AS TEXT)  -- Removes .0 for whole numbers
                        ELSE CAST(ROUND(SUM(EXTRACT(EPOCH FROM(s.completed_at-s.started_at)))/3600.0, 1) AS TEXT)  -- Keeps decimals for non-whole numbers
                    END AS "hours_of_mentoring_sessions",
                    COALESCE(CAST(ue.rating ->>'average'AS NUMERIC),0) AS "avg_mentor_rating" 
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
            ;`,
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
