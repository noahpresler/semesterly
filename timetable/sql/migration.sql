-- table to contain all textbooks
CREATE TABLE "new_textbook" (
  "id" serial NOT NULL PRIMARY KEY, 
  "isbn" varchar(13) NOT NULL, 
  "detail_url" varchar(1000) NOT NULL, 
  "image_url" varchar(1000) NOT NULL, 
  "author" varchar(500) NOT NULL, 
  "title" varchar(1500) NOT NULL
);

-- temporary table to contain all uoft textbooks
CREATE TABLE "uoft_textbooks" (
  "id" serial NOT NULL PRIMARY KEY, 
  "isbn" varchar(13) NOT NULL, 
  "detail_url" varchar(1000) NOT NULL, 
  "image_url" varchar(1000) NOT NULL, 
  "author" varchar(500) NOT NULL, 
  "title" varchar(1500) NOT NULL
);

-- temporary table to contain all jhu textbooks
CREATE TABLE "jhu_textbooks" (
  "id" serial NOT NULL PRIMARY KEY, 
  "isbn" varchar(13) NOT NULL, 
  "detail_url" varchar(1000) NOT NULL, 
  "image_url" varchar(1000) NOT NULL, 
  "author" varchar(500) NOT NULL, 
  "title" varchar(1500) NOT NULL
);

-- new manytomany tables
CREATE TABLE "timetable_link" (
  "id" serial NOT NULL PRIMARY KEY, 
  "textbook_id"
  "is_required" boolean NOT NULL, 
  "courseoffering_id" integer NOT NULL
);

CREATE TABLE "timetable_hopkinslink" (
  "id" serial NOT NULL PRIMARY KEY, 
  "is_required" boolean NOT NULL, 
  "hopkinscourseoffering_id" integer NOT NULL
);

ALTER TABLE "timetable_link" ADD COLUMN "textbook_id" integer NOT NULL;
ALTER TABLE "timetable_link" ALTER COLUMN "textbook_id" DROP DEFAULT;
ALTER TABLE "timetable_hopkinslink" ADD COLUMN "textbook_id" integer NOT NULL;
ALTER TABLE "timetable_hopkinslink" ALTER COLUMN "textbook_id" DROP DEFAULT;

-- add textbooks, then union into new global textbook table
INSERT INTO uoft_textbooks(id, isbn, detail_url, image_url, author, title)
SELECT id, isbn, detail_url, image_url, author, title FROM timetable_textbook;

INSERT INTO jhu_textbooks(id, isbn, detail_url, image_url, author, title)
SELECT id, isbn, detail_url, image_url, author, title FROM timetable_hopkinstextbook;

INSERT INTO new_textbook(isbn, isbn, detail_url, image_url, author, title)
SELECT * FROM uoft_textbooks UNION SELECT * FROM jhu_textbooks;

-- populate new manytomany tables
INSERT INTO timetable_link(textbook_id, is_required, courseoffering_id)
SELECT m.courseoffering_id, t.is_required, m.courseoffering_id
FROM timetable_courseoffering_textbooks AS m, timetable_textbook AS t;

INSERT INTO timetable_hopkinslink(textbook_id, is_required, courseoffering_id)
SELECT m.courseoffering_id, t.is_required, m.courseoffering_id
FROM timetable_hopkinscourseoffering_hopkinstextbooks AS m, timetable_hopkinstextbook AS t;

-- drop old tables we don't need, rename textbook table
DROP TABLE timetable_textbook, timetable_hopkinstextbook, 
timetable_hopkinscourseoffering_hopkinstextbooks, timetable_courseoffering_textbooks;

ALTER TABLE new_textbook RENAME TO timetable_textbook

-- drop other columns we don't need
ALTER TABLE timetable_hopkinscourseoffering DROP COLUMN can_be_locked
ALTER TABLE timetable_courseoffering DROP COLUMN can_be_locked
ALTER TABLE timetable_hopkinscourse DROP COLUMN breadths