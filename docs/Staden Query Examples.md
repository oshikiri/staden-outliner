- ## Total number of blocks
	- {{query }}
		- ```sql
		select count(1) from blocks_p
		```
- ## Get pages
	- {{query }}
		- ```sql
		select * from pages limit 5
		```
- ## Get blocks
	- {{query }}
		- ```sql
		select * from blocks_p limit 5;
		```
- ## Links
	- {{query }}
		- ```sql
		select
		  links.*,
		  p_from.page_title as page_title_from_as_pageref,
		  p_to.page_title as page_title_to_as_pageref
		from links
		join blocks_p as p_from on p_from.id = links.from_id
		join blocks_p as p_to on p_to.id = links.to_id
		limit 10;
		```
- ## Extract SQL queries
	- {{query }}
		- ```sql
		with queries as (
			select
				page_title as page_as_pageref,
				b.content as sql_as_tokens
			from blocks_p b
			where
				exists (
					select 1 from json_each(b.content) as token
					where token.value ->> 'type' = 11 and token.value ->> 'lang' = 'sql'
				)
		)
		select * from queries limit 5;
		```
