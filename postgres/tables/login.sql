create table login(
    email text unique not null primary key,
    hash varchar(100) not null
);

commit;