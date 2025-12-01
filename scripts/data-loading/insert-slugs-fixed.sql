INSERT INTO slugs (id, created_at, slug, is_current, updated_at, viewpoint_group_id, direct_embedding_id)
VALUES
    ('6e5d3122-1b6b-4337-90cb-293889eef03a', '2025-10-09T23:45:21.311595+00:00'::timestamptz, 'qidic2s9', TRUE, '2025-10-28T23:46:31.740409+00:00'::timestamptz, '4d627244-5598-4403-8704-979140ae9cac', '8563a32f-fc94-4009-8427-a2dd4a7da99f'),
    ('7874d6f0-f29e-44ad-bb39-b5b7c46f5c11', '2025-09-22T22:08:14.527285+00:00'::timestamptz, 'e9hp55s2', TRUE, '2025-10-28T23:49:26.808096+00:00'::timestamptz, '56276ce9-2aed-425a-9f07-f7ae88b8dde6', '0a1e9730-d0dd-49bc-94e2-05b49255371a'),
    ('a4ddb520-1b46-46c7-9a18-ec9143274c80', '2025-05-05T01:20:04.243905+00:00'::timestamptz, 'awd92zdq', TRUE, '2025-10-28T23:46:46.119017+00:00'::timestamptz, 'f6f36582-6b7b-4566-a8d9-8a9628a01809', '775af03b-0a2d-47fc-95cb-128704a251ac'),
    ('db86f300-a620-4451-b408-72746a61893f', '2025-07-14T07:35:35.216355+00:00'::timestamptz, 'zasua6m7', TRUE, '2025-10-28T23:45:49.774513+00:00'::timestamptz, '6e0c5f9a-7e6c-460d-8661-26a0f809021d', 'ac682730-3469-4e81-a2a9-352d5c4266c8'),
    ('e49d67cf-c2e6-4bf4-98a1-16eceafc93a1', '2025-09-25T14:28:25.088387+00:00'::timestamptz, 'sb6wsbkt', TRUE, '2025-10-28T23:49:40.015879+00:00'::timestamptz, '0942403f-9565-40dd-b93f-ebb88f4f540f', '126c16a1-3159-4342-af2a-1d6b8ca98f71')
ON CONFLICT (id) DO NOTHING;