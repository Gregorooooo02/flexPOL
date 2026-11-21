alter table question
    add column assignment jsonb,
    add column comparison jsonb,
    add column number_exercise jsonb;

alter table attempt_answer
    alter column selected_option_id drop not null,
    add column assignments jsonb,
    add column numeric_value numeric(16,6);
