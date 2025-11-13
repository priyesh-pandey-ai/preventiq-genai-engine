ALTER TABLE events
ADD CONSTRAINT unique_event UNIQUE (message_id, event_type);