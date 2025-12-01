INSERT INTO profile_viewpoint_group_rel_types (value, description)
VALUES
    ('default', 'Default viewpoint group for profile'),
    ('administrator', 'User administrates this viewpoint group'),
    ('leader', 'User leads this viewpoint group'),
    ('bookmarker', 'User has bookmarked this viewpoint group'),
    ('supporter', 'User supports this viewpoint group')
ON CONFLICT DO NOTHING;