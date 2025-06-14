-
- The lexer is responsible for converting a string of markdown `content` into a list of tokens (`Token[]`).
- The parser is responsible for converting a list of tokens (`Token[]`) into a hierarchical Block.
- ## Explain parser.ts
	- 具体例をいくつか考えた後に、それをアルゴリズムとしてまとめる。
	- ### 例1
		- 例えば以下のようなマークダウンファイルをパースすることを考える。
		- ```markdown
		- item1
		  - item1-1
		```
		- Parserがこのmdを読み込んで、以下のような一つのBlockに変換したい。
		- ```typescript
		Block("", [
		  Block("item1", [
		    Block("item1-1", [])
		  ])
		]);
		```
	- ### 例2: 深さ1の場合
		- item2が追加されたと考える。
		- ```markdown
		- item1
		  - item1-1
		- item2
		```
		- rootの子でitem1の次の位置にitem2を追加する
		- ```typescript
		Block("", [
		  Block("item1", [
		    Block("item1-1", [])
		  ]),
		  Block("item2", [])
		]);
		```
	- ### 例3: 深さ2の場合
		- ```markdown
		- item1
		  - item1-1
		  - item1-2
		```
		- item1の子でitem1-1の次の位置にitem1-2を追加する
		- ```typescript
		Block("", [
		  Block("item1", [
		    Block("item1-1", []),
		    Block("item1-2", [])
		  ]),
		]);
		```
	- ### 例4: 深さ3の場合
		- ```markdown
		- item1
		  - item1-1
		    - item1-1-1
		```
		- item1-1の子としてitem1-1-1を追加する
		- ```typescript
		Block("", [
		  Block("item1", [
		    Block("item1-1", [
		      Block("item1-1-1", [])
		    ])
		  ]),
		]);
		```
	- ### Analysis
		- 一行ずつ読み込みつつパースしていくことを考える。
		- スタックを用意する。
		- ```markdown
		- item1
		  - item1-1
		```
		- 上記の行まで読み込んだときにスタック
		- ```plaintext
		[root, item1, item1-1]
		```
		- ここで問題なのが、パーサーは次の行に何が来るかわからないため、例の深さ1,2,3のすべてに対応できるようにしておく必要がある。
		- そこでParserでは以下のような挙動をすると考えてみる。
			- 深さ1の場合
				- step1: [root, item1]まで畳む（つまり、item1-1をitem1の子に入れる）
				- step2: スタックにitem2をpushする [root, item1, item2]
			- 深さ2の場合
				- step1: スタックにitem1-2をプッシュする [root, item1, item1-1, item1-2]
				- 注意: 同じ高さのものはあとでまとめてたたむ。つまりこの段階で item1-1をitem1にたたまない
			- 深さ3の場合
				- step1: item1-1の子としてitem1-1-1を追加する [root, item1, item1-1, item1-1-1]
	- ### Algorithm
		- 上記の挙動でいけそうなので以下のようでアルゴリズムの形にまとめてみる。
		- 1. 初期値: スタックにルートノードのみを追加しておく。[Block("", [])]
		- 2. 各行を読み込んだときに以下の処理を行う
			- 1. 追加する前にスタックを見て、末尾を新しく追加したいアイテムの深さ `depth` までたたむ
			- 2. スタックに新しいアイテムを追加する
		- 3. 最後の行まで行ったときに深さ0まで畳む
			- 「たたむ」というのが `collapseTailUntil(stack: Block[], depth: number)` がやっていること。
- ## その他
	- ここだけ切り出して高速化することを想定していたが、TypeScript版でも十分早かったのでやらなかった。
