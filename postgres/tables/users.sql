create table users(
    id serial primary key,
    name varchar(20),
    email text unique not null,
    image varchar(100),
    color varchar(20),
    wins int default 0
);

alter table users
    add constraint fk_email foreign key(email)
    references login(email)
    on delete cascade on update cascade;