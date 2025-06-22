- {{query }}
	- ```sql
	with versions as (
	    select
	        regex_capture(p_from.content_markdown, 'v(\d)\.(\d)\.(\d):(.+)') as cap
	    from links
	    join blocks_p p_from on p_from.id = links.from_id
	    join blocks_p p_to on p_to.id = links.to_id
	    where p_to.page_title = 'Staden Versions'
	)
	select
	    cap ->> '$[0]' as major,
	    cap ->> '$[1]' as minor,
	    cap ->> '$[2]' as patch,
	    cap ->> '$[3]' as description
	from versions
	where
	    cap ->> '$[3]' is not null
	```
