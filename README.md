# GoingUp
 A feature-rich vanilla JS platform-jumper *not yet* squished into a single html file intended as a playable NFT.

##Overview
- The intent of this project is as a fun, demonstrated use-case of the often overlooked ability to turn interactive, localized html files within ERC & Metaplex Standard (Ethereum & Solana based contracts)

## Features:
1. a lil plotline
2. ~user color customizability~ (mulling over a different user customizable option else this feature stands)
3. level difficulty options

## Version Log:

### v0.0.1
- working game mechanics (player movement, collision, item collection, score)
- placeholder 'play again' screen on win
	- win = collect 16 items
### v0.0.2 (New)!
- added main menu with placeholder settings screen
- working Reset button on Win Screen which continues the game from 0 post-win
	- win = collect 16 items
 	- platforms now continue generating post-reset-press
- added 'player color cycler'
- added placeholder game canvas background

## Known Bugs
- v0.0.1
	- ~Platforms do not resume with the rest of the gameLoop 
	on winning the game and starting over~
- v0.0.2
	- cursor doesn't re-disappear if player continues from Win/Reset Screen
	- Main Menu button on win Screen doesn't work!
