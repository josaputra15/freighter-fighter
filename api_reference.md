# Objects

## Lobby Data
dict that connects lobby name to lobby properties

## Lobby Properties
dict with lobby properties and associated values

## Ship Map
2d array
- O's in empty spaces
- some symbol representing a particular ship for any tile that ship is in
    - these symbols are different per ship - ship1 symbol != ship2 symbol


## Guess/Hit Map
2d array
- O's in empty spaces
- X's in missed guesses
- H's in hits
- D's in destroyed slots


# Functions

## guess
- from user to lobby server
- contains x,y for a guess
    - in response, the server updates its guessMaps (by checking the move against its shipMaps)
        - and then it responds to the original one with a rerender, and a "notYourTurn" 
        - and then it responds to the opponent with a rerender, and a "yourTurn" signal