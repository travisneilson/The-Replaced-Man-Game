# Product Requirements Document: The Replaced Man; The Game

## 1. Overview & Vision

* **Product Name:** The Replaced Man; The Game
* **Logline:** A man searching for connection begins to uncover the truth about himself.
* **Vision Statement:** To create a top-down, narrative exploration game that translates the themes of the screenplay "The Replaced Man" into an interactive experience. The game will focus on player choice and environmental storytelling, driven by a minimalist "tech-noir" aesthetic and a unified, context-sensitive interaction system.
* **Narrative Focus:** The game will focus primarily on **Character** and **Lore**. The Golden Rule of our narrative design is: 
    > "Always be presenting lore, AND MAKE IT SERVE the character." 
    Every piece of world-building will be filtered through Thomas's personal journey.
* **Structural Theme:** The entire game is a **never-ending loop**. Upon reaching the story's conclusion, the game will seamlessly restart, reinforcing the screenplay's tragic, cyclical themes of identity.

## 2. Style, Tone, & Inspirations

* **Aesthetic:** Tech-Noir Tragedy. The visual style is minimalist and monochrome, evocative of retro computer terminals and classic noir cinema. It will be framed with stylized ASCII borders.
* **Emotional Tone:** The primary feelings are sadness, paranoia, mystery, and the quiet tragedy of a repeating cycle.
* **Reference Media:** *Blade Runner*, *Ex Machina* (2014), *Westworld*, and the general mood of the Detective Noir genre.
* **Surreal Environments:** Certain scenes, such as flashbacks or psychological breaks, will be defined as "surreal." These scenes will use unique visual effects (e.g., glitchy ASCII borders, color-shifting filters, distorted overlays) to represent Thomas's disorientation.

## 3. Core UI & Layout

The game is presented as a single, cohesive "console" view based on the provided wireframes.

* **Game Area:** The primary space for gameplay, where the player controls Thomas. It will feature a subtle atmospheric overlay (vignette, scanlines).
* **Narrative Area:** A separate, bordered area below the Game Area where all narrative text and dialogue is displayed via a typewriter effect.
* **Narrative Header:** The top section of the Narrative Area, displaying:
    * **Act:** e.g., `Act 1 - An Unsettling Quiet`
    * **Weekday:** e.g., `Monday`
    * **Objective:** A clear, high-level goal for the current scene.
* **Footer / Hint Bar:** A dedicated area at the bottom for persistent hints, activated by the `[H]` key.

## 4. Core Player Mechanics

* **The Mantra Mechanic:**
    * **Acquisition:** Thomas starts with zero Mantras. He "collects" Mantra charges (`[+1 Mantra]`) by interacting with specific nodes in the world (e.g., a sticky note on a mirror). A UI element will track the current count.
    * **Activation:** The player can press a dedicated key (`[M]`) at any time to "spend" a Mantra charge.
    * **Effect:** Using a Mantra triggers a unique, context-sensitive line of narrative in the Narrative Area. Each room will have a list of possible Mantra narratives, and the game will select and display one **at random**.

* **The Unified Node Interaction System:**
    * **Concept:** All interactions (for doors, objects, and people) are standardized into a single "Node" system.
    * **Node Visuals:** Each interactive point is a "node," represented by its own unique `iconEmoji` (e.g., `👩🏻` for Joi, `🖼️` for a picture frame).
    * **Interaction Prompt:** When near a node, it will highlight, and a multi-option prompt will appear, listing available actions with their corresponding keys (e.g., `[E] Talk to Joi`, `[F] Reach out`).
    * **Node Types:** `object`, `npc`, `exit`, and `mainQuest` (which are visually distinct).
* **Dynamic Player Emoji:** The player's emoji has a `defaultEmoji` for the room and changes to a `proximityEmoji` when near a node to foreshadow the interaction's tone.

## 5. The Dynamic Narrative System

* **Conversation Flow:** Multi-stage conversations are turn-based. When initiated, player movement is locked, and the `game-area` is visually altered to show a "locked" state. The UI presents choices, and the player must select an option to resolve the interaction and regain movement control.
* **Stateful Narrative:** The text in the Narrative Area is dynamic and will change to reflect the consequences of player actions, creating a new, persistent room state.
* **Act-Based State Changes:** The core state of rooms (node placement, available interactions) remains consistent throughout an entire Act. Major changes to the world will occur between Acts, allowing for locations to be revisited in a different state.

## 6. Controls

* **Movement:** `Arrow Keys`.
* **Interaction:** Contextual keys displayed by the node prompts (e.g., `E`, `F`, `T`, `J`).
* **Hint:** `[H]` key.
* **Mantra:** `[M]` key.


### Development Notes and TODOs:
- The NoirScreen effect is gone again. and I loved it. Bring it back!
- Think of information systems.
- - Game Title
- - Setting description
- - Node snippets
- - Game Hints
- - Interative information which is text that is generated as a result of taking an action for example... "plays a record: might result in a narrative response of text." is that narrative area content?
- - have a spot where people can download and read the script.
- Outline room transitions
- - Crossfade, and push out the direction of door. When the crossfades in, character is int the middle.
- Define a list of characters and objects.
- Outline the narrative of the game. Needs a strong narrative which enhances the script.
- responsive or at a min it must have fixed CSS structure.