- Staden is an outliner inspired by Logseq.
- ![](../icon.png)
- [[Staden Versions]]
- [[APIs]]
- Staden uses Logseq-style markdown syntax
	- [[Staden Markdown Syntax]]
	- Staden implements the original [[Markdown Parser]]
	- Staden imports markdown files using [[Importers]]
- [[Staden Query Examples]]
- 
- ## Glossary
	- vault: page[] + config
	- page: block that has no parent (depth=0)
	- block
		- See src/app/lib/markdown/block.ts
	- Journal
		- page `YYYY-MM-DD.md`
- ## Architecture
	- Staden uses SQLite as its backend database.
	- In outliners like Logseq, documents have a hierarchical structure.
	- In Staden, this hierarchical structure is represented by the following blocks table:
		- ```sql
		  CREATE TABLE IF NOT EXISTS blocks (
		    id TEXT PRIMARY KEY,
		    page_id TEXT,
		    parent_id TEXT,
		    content TEXT
		  )
		  ```
	- Blocks are retrieved in bulk by page_id and stored in memory, then reconstructed into a hierarchical structure in JavaScript based on the parent_id.
	- This approach has the following limitation:
		- The number of blocks within a page is typically small (< 100)
