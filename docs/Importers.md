- ## bulk importer
	- It used to load large amounts of markdown during initial startup.
	- The challenge here is that we need behavior like "Does this pageref destination exist? If it exists, add the destination block id to the edge. If not, create a block/page and add the created id to the edge."
		- We need to branch based on whether it exists (get pageid) or not (create page).
		- If we access the database every time for this operation, it becomes slow, so we need to do it in memory.
	- Initially, all blocks are loaded into memory, so if the number of pages is very large, it could become problematic.
- ## incremental importer
	- Used to reflect differences to the vault when blocks are incrementally updated from the UI after bulk import.

