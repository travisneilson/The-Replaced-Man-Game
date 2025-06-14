# The-Replaced-Man-Game

## Product Requirements Document: The Replaced Man
1. Overview & Vision

Product Name: The Replaced Man
Logline: A man searching for connection begins to uncover the truth about himself. 
Vision: To create a top-down, narrative exploration game based on the provided movie script. The game will blend the exploratory feel of a classic adventure game with the emotional depth of a branching narrative. The primary gameplay loop will involve walking the character, Thomas, through different scenes to uncover the story, make choices, and experience his internal conflict.

2. Target Audience

Players who enjoy story-rich, atmospheric indie games, narrative-driven experiences, and choose-your-own-adventure style gameplay.

3. Core Features & Gameplay Mechanics

Top-Down Exploration:
The player will control the main character, Thomas, from a top-down perspective.
Movement will be controlled via the four arrow keys on the keyboard.
Narrative Choice via Movement:
The primary method for making choices and advancing the story is by walking the player character off the edge of the screen (North, South, East, or West).
Each exit will lead to a new "room" or scene, revealing the next part of the story.
Not all rooms will have exits in all four directions, creating structured paths, hallways, and dead ends.
Modular, Procedural Environments:
Each room will be visually distinct, constructed from a set of reusable and combinable SVG assets (e.g., walls, furniture, environmental objects).
The placement and combination of these assets can be randomized to create a fresh feel for each scene.
Story & UI Display:
Upon entering a new room, a block of expository text will appear on screen, taken directly from the script's descriptions and dialogue.
A persistent UI will display the High Score and game title in the header.
4. Creative & Emotional Mechanics

Dynamic Emoji States:
The player character will be represented by an emoji.
The emoji's expression will change based on the mood of the current room (e.g., 😊 for happy, 😔 for pensive) to visually communicate Thomas's internal state.
Interactive "Echoes":
Certain significant items from the script (e.g., a family photo , a record player ) will be interactive objects within a room.

When the player is near an object, a visual cue will appear.
Pressing an action key will display a fragment of Thomas's inner monologue or a key line from the script related to that object.
The "Mantra" Mechanic:
The player will be able to press a dedicated key (e.g., "M") at any time.
This will trigger a visual display of Thomas's mantra, "I am worthy of love", accompanied by a subtle sound effect, to connect the player with his internal struggle.

The "Memory Glitch" Effect:
During transitions between key narrative scenes (especially flashbacks), a brief visual glitch effect (e.g., pixelation, scanlines) will occur.
This may cause previously visited rooms to appear subtly altered upon the player's return, enhancing the theme of unreliable memory.
5. Start-up & Initial Experience

The game will begin on a "Click to Begin" screen featuring a single, bouncing emoji.
After the player clicks, a main Title Screen will appear, featuring an animated title ("BRICK RUNNER")  and a "Press SPACE to Begin" prompt.
An intro song will play once on the Title Screen.
Pressing SPACE will start the game, with the character on an initial dark screen, from which the player makes their first choice by walking in a direction.
6. Technical Stack

Language: Vanilla JavaScript (ES6+), HTML5, CSS3
Graphics: Player character and all environmental assets will be rendered as SVG elements for style flexibility and scalability.
Audio: The Web Audio API will be used to manage and play all sound effects and music.
7. Out of Scope (for Version 1.0)

Real-time combat or action sequences.
Complex inventory management systems (beyond simple flags for key items).
A saved game/progress system.
The "1-UP" and "Multi-ball" power-ups from our previous game project.
This document outlines the complete vision for "The Replaced Man" as a game. It provides a clear roadmap for what we need to build, focusing on a stable, modular architecture.


### Development Notes and TODOs:
- The NoirScreen effect is gone again. and I loved it. Bring it back!
- Think of information systems.
    -- Game Title
    -- Setting description
    -- Node snippets
    -- Game Hints
    -- Interative information which is text that is generated as a result of taking an action for example... "plays a record: might result in a narrative response of text." is that narrative area content?
    -- have a spot where people can download and read the script.
- Outline room transitions
    -- Crossfade, and push out the direction of door. When the crossfades in, character is int the middle.
- Define a list of characters and objects.
- Outline the narrative of the game. Needs a strong narrative which enhances the script.
