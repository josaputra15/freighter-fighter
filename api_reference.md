# Objects

## Lobby Data
dict that connects lobby name to lobby properties

## Lobby Properties
dict with lobby properties and associated values

## Ship Map
2d array
- 0's in empty spaces
- number for each ship:
    - 2-long is 1
    - 3-longs are 2 and 3
    - 4-long is 4
    - 5-long is 5


## Guess/Hit Map
2d array
- 0 in empty spaces
- 97 in missed guesses
- 98 in hits
- 99 in destroyed slots


# Functions

## guess
- from user to lobby server
- contains x,y for a guess
    - in response, the server updates its guessMaps (by checking the move against its shipMaps)
        - and then it responds to the original one with a rerender, and a "notYourTurn" 
        - and then it responds to the opponent with a rerender, and a "yourTurn" signal