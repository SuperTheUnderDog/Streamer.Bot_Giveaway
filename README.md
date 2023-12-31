# Giveaways with Streamer.Bot
This extension adds giveaway functionality to your [Streamer.bot](https://streamer.bot/) setup.
Version: 1.3.0

Written for Streamer.Bot version 0.2.2

*Setup for Twitch only. No YouTube support currently

## Features
- Run giveaways for people in your chat to enter
- Roll the winner either invisibly or on a wheel
- Automatically send winner in chat
- Automatically handles giving out the reward
- Highly configureable and customizable
 - Allows support for multiple pre-configurations to easily swap between

# Setup
To set up this extension, follow these steps:
1) Import contents of [export.txt](export.txt) into your Streamer.Bot.
   - You will need to set a settings file inside the Setup Picker action. (see step 4)
   - You will need to set the File Watcher trigger in the Info Sender action. (see step 6)
   - Remember to enable the commands and configure them to your liking.
2) Download the contents of [WheelSpinner](WheelSpinnerFromScratch)
   - Check the [spinner.js](WheelSpinnerFromScratch/spinner.js) to make sure the `WEBSOCKET_URI` and `ACTION_ID` match your Streamer.Bot setup (they are set to the current defaults).
   - There are a few other settings in the same script you can play around with to configure your wheel. You can also leave them as default.
3) Download the <a href="/giveaway/Example settings files">example settings files</a>.
   - Use <a href="/giveaway/Example settings files/exampleGiveawaySettingsFull.json">exampleGiveawaySettingsFull.json</a> and <a href="?readme=1#settings-file-properties">the Settings File Properties section</a> as a reference to configure your settings. Notice <a href="/giveaway/Example settings files/exampleSettingsOptions.json">exampleSettingsOptions.json</a> references settings files instead of setting them itself.
   - **IMPORTANT:** You must set a `configPath` or a `fixedEntries` array.
     - If you want to use a wheel, `configPath` is needed even if using `fixedEntries`. Only the wheel properties are needed then.
   - All properties should be strings, or arrays of strings (see example)
   - Don't use "..." for paths like in the example files - enter the full paths
4) After configuring your own, set `exampleSettingsOptions.json` or your equivelant in Setup Picker under the `Set argument %settingsChoicePath%` subaction as mentioned in step 1, or if you're only using a single settings file- set your file in the `Set argument %settingsPath%` sub action of the same action and disable the other subaction.
   - If using `%settingsPath%` directly, make sure you enable the sub action.
   - Make sure the file paths aren't surrounded by extra quotation marks
5) Configure your config file(s), if you have any.
   - If you want to run actual giveaways, and not only roll pre-determined entries, you're going to need a config file.
   - Check the <a href="?readme=1#config-file-properties">Config File Properties section</a> for more information. You can also use the <a href="/giveaway/Example config files">Example config files</a> for reference.
6) (if using a wheel) Set the File Watcher trigger in the Info Sender action (under the Wheel Spinner group) so that it watches the folder/s set in your config file/s for the wheel files (specifically- so that it triggers when the values file and when the spin file change).
   - Make sure it's watching both the correct folder and the correct files
   - You can set the watcher either to the specific files, or use the * wildcard character. (For example: ending with a `*.*` will watch all files in the folder. `*.json` will watch all the json files in it.)

*By default, the `Display Time on deck` action is disabled. If you have a Stream Deck and would like to display the remaining time for the giveaway on one of its buttons, make sure to enable it and set the button's ID in your settings file.
### Setting up OBS
If using a wheel, you'll need to set up OBS so it can be displayed.
You'll need 2 browser sources (which you'll be refrencing in your settings file- see step 3 above). 1 source will be used to display the wheel, and 1 to display the winner.

Wheel source:
- You can leave everything as default.
- **Important** The boxes for `Local file` (top of the properties), `Shutdown source when not visible`, and `Refresh browser when scene becomes active` (bottom of the properties) *must* be disabled/unchecked for the wheel to work.
- If you're experiencing issues, you can try hitting the `Refresh cache of current page` button at the bottom of the source's properties.

Winner source:
- `Local file` (top of properties) should remain unchecked/disabled.
- `Shutdown source when not visible` and `Refresh browser when scene becomes active` (bottom of the properties) should be checked/active (otherwise the confetti might not work).

## And that's it! You're good to go!
You can go into your stream and trigger a giveaway (by default, the command `!sga` or `!startgiveaway` will start a giveaway). See the following section for some options and details.

*Make sure your Streamer.Bot websocket is started and, if using the wheel, OBS is connected

### To summarize
- You should have set up a config file, a settings file, and potentially a settings options file (recommended).
- You've set the path of you settings/settings options file inside the `Setup Picker` action.
- You've set the `File Watcher` triggers for the `Info Sender` action
- You've set up your OBS sources (and made sure the bot and OBS are connected)
- Your Streamer.Bot websocket is active

# Settings
## Settings File Properties
- Make sure you have either a configPath or a fixedEntries array set as a bare minimum.
- The file's contents should be a valid json.
- I recommend using a default settings file<sup>(see <a href="#settings-options-file-properties">the options file section</a>)</sup> for properties such as the site addresses (`spinnerSiteAddress`, `winnerSiteAddress`, `blankSiteAddress`) and the OBS names (`obsSpinnerSource`, `obsWinnerSource`, `obsSpinnerScene` & `obsWinnerScene` or `obsScene`), as well as any other properties you have that don't often change.
- Any property can be ommitted to use the default instead
- When starting a giveaway, you can pass it arguments to overwrite properties set by defaults/a setting file:
  - Send an argument with the same name as the property you wish to overwrite. This cannot be achieved via Twitch chat, but can be set up to be tied to other actions, a Stream Deck button, etc.
  - `duration`, specifically, can be set through Twitch chat when calling the start giveaway command by sending it as a first argument. (For example: `!sga 30000` will start a giveaway with 30 seconds (30,000 milliseconds) on the timer)
- If you have multiple settings file set using `%settingsChoicePath%` and a file with the structure of <a href="/giveaway/Example settings files/exampleSettingsOptions.json">exampleSettingsOptions.json</a>, you can choose which one to use by passing its index as a 2nd argument when calling the start giveaway command
  - This will reset any overwritten properties. You can pass arguments when calling same command to set them anew.
  - If you wish to use the default duration/the duration set in the file, pass something other than a number as the first argument. (For example: `!sga r 0` will use the first (index 0) settings file in the array with the duration set in it/by the defaults, where as `!sga 30000 0` will use that same settings file with a duration time of 30 seconds)
  - Will default to the first path in the array, if none is chosen and this is the first giveaway run since the bot has been started.
- Unless specifying which settings file to use as explained in the above point, settings do not reset between runs. This means you can simply start the next giveaway with no arguments to use the same parameters as your last ran giveaway.

Property | Explanation | Default value | Notes
------- | ------- | ------- | -------
configPath | Path to the config file | "" | 
spinnerSiteAddress | Base url for the wheel. Link to your copy of [the matching index.html](WheelSpinner/index.html), or where it's hosted. | "" | I recommend opening the file in browser and copying from there, rather than trying to copy the path to the file.
winnerSiteAddress | Base url for the winner. Link to your copy of <a href="WheelSpinner/Wheel Winner/index.html">the matching index.html</a>, or where it's hosted. | "" | I recommend opening the file in browser and copying from there, rather than trying to copy the path to the file.
blankSiteAddress | Base url for a blank page. Link to your copy of [blank.html](WheelSpinner/blank.html), or where it's hosted. | "" | I recommend opening the file in browser and copying from there, rather than trying to copy the path to the file. This is used to prevent the last frame of a previous roll from showing before spinning the wheel.
|||
obsSpinnerScene | The name of the scene containing the Wheel Spinner browser source | "" | If left blank/ommitted, will use obsScene to populate this field
obsSpinnerSource | The name of the Wheel Spinner browser source | "" | Make sure the source <span style="color: #F00;">ISN'T</span> set to local file, and that the 2 boxes at the bottom (`Shutdown source when not visible` and `Refresh browser when scene becomes active`) <span style="color: #F00;">AREN'T</span> marked
obsWinnerScene | The name of the scene containing the Wheel Winner browser source | "" | If left blank/ommitted, will use obsScene to populate this field
obsWinnerSource | The name of the Wheel Winner browser source | "" | Make sure the source <span style="color: #F00;">ISN'T</span> set to local file, and that the 2 boxes at the bottom (`Shutdown source when not visible` and `Refresh browser when scene becomes active`) <span style="color: #0F0;">ARE</span> marked
obsScene | The name of the scene containing the Wheel Winner and the Wheel Spinner browser sources | "" | obsSpinnerScene and obsWinnerScene take precedence, if set
|||
duration | The duration of the giveaway, in milliseconds | "300000" | Can be passed as a first argument when starting a giveaway to overwrite it
useWheel | Whether to use the wheel | "True" | Rolls invisibly if set to false
removeWinnerFromPool | Whether to remove winner from entries pool | "True" | Useful for rerolls
endGiveawayActionId | The id of the action to call when the giveaway ends | "9c528bf0-b2ec-4456-bb4a-30d6d58a5aec" (End Giveaway) | Use if you have a custom action, or an action to run before End Giveaway is called (and then call End Giveaway from it). Recommended to leave as is/ommit from your file.
whisper | Whether to try whispering the winner | "False" | If false, and multiple reward options are given, choosing a reward will be handled in the public chat
msgType | (For picking a reward) Whether to accept responses starting with the number choice, or containing exactly the number choice | "input0" | "input0" to accept any message starting with the number choice, "message" for accepting only answers that are EXACTLY the number choice
sendWhisperFromBot | Whether to send whispers from the Bot account | "False" | If set to false, will send from the Broadcaster account
sendPublicFromBot | Whether to send public chat messages from the Bot account | "True" | If set to false, will send from the Broadcaster account
|||
announceColor | The color for the announcements | "purple" | Valid options: "default", "blue", "orange", "green", "purple". Anything else will be handled the same as "default"
doGiveawayAnnouncements | Whether to use announcements | "true" | Not all messages will send as announcements, even if this is set to "true". For example, time updates will send as regular messages, whereas the message about the giveaway starting or ending will be sent as an announcement. If set to false, all messages will be sent as regular messages
|||
announceThresholds | In milliseconds. Will send a reminder message in chat when there is this amount of time left to enter the giveaway | "[90000, 30000]" | Values should be sorted from largest to smallest. Any times smaller than lastAnnounceThreshold will not be used.
announceEvery | In milliseconds. Will send a reminder message in chat if it's been this long since the last one | "300000" | Set to "-1" to disable
lastAnnounceThreshold | In milliseconds. Will send a *last chance reminder* when there is this long left to join the giveaway | "60000" | Set to "-1" to disable
respondType | How to handle printing about users joining the giveaway | "EveryTimeAmount" | Valid options: "None" (don't print about users joining), "EveryUser" (print for every user added), "EveryUserAmount" (print every time a specified amount of users have been added), or "EveryTimeAmount" (print about users joining, but not more often than the specified time amount)
respondTimeAmount | (If respondType is set to "EveryTimeAmount") In milliseconds. How often it can print | "90000" | 
respondUserAmount | (If respondType is set to "EveryUserAmount") Every how many users added to print | "10" |
respondDelay | (If respondType is set to "EveryTimeAmount") In milliseconds. Sets an initial delay to the prints | "30000" | Set to "-1" to disable
|||
timeButton | The ID of a button on your elgato Stream Deck to display the time remaining for the giveaway on | "" |
wheelDelay | In milliseconds. A delay to have between showing the wheel on screen and when it starts spinning | "1" |
|||
fixedEntries | The enrties to use instead of running a giveaway | "[]" | If this is set and not empty, will take precedence over running a giveaway. It works both with the wheel and invisibly. This option **SHOULD NOT** be set in a defaults settings file, but in specific files, as you may forget to overwrite it.

## Settings Options file properties
- Optional file (recommended). See step 4 of the [#setup](#setup)
- see <a href="Example settings files/exampleSettingsOptions.json">exampleSettingsOptions.json</a> for reference

Property | Explanation | Default value | Notes
------- | ------- | ------- | -------
defaultSettings | Path to the default settings file | "" | The settings defined in this file will be used for all your giveaways, unless the specific settings override it.
settings | Array of paths to specific settings files | [] | **(Required)** By default, will use the first path listed. You can swap which settings file you use when starting a giveaway, by sending its index in this array (notice- the array is 0-indexed) as a 2nd argument <sup><a href="#settings-file-properties">(see Settings File Properties for examples)</a></sup>

## Config File Properties
- The file's contents should be a valid json
- All paths should be full paths

Property | Sub-property | Type | Explanation | Notes
------- | ------- | ------- | ------- | -------
resultsFile || string | Path to a file to write the results into (Optional) | This file doesn't have to be an existing file. The path should be a full path. Streamer.Bot needs to be able to write to the file.
wheelSettings || JSON object | Holds the settings for the wheel | Required if using a wheel. Optional otherwise.
<span></span>| folder | string | Path to the folder holding the icon, values, and spin files | Full path.
<span></span>| icon | string | The file to use as an icon in the middle of the wheel | Path relative to the folder.
<span></span>| values | string | This file will be used by the bot to send information | Path relative to the folder. This file doesn't have to be an existing file, and will get overwritten by the bot. Streamer.Bot needs to be able to write to the file.
<span></span>| spin | string | This file will be used by the bot to send information | Path relative to the folder. This file doesn't have to be an existing file, and will get overwritten by the bot. Streamer.Bot needs to be able to write to the file.
<span></span>| colorGradient | array of strings | Valid colours defined here will be used to create a gradient, or multiple gradients, to use as background colours for the wheel slices (Optional) | Supported colour formats include: #FFF, #FFFFFF, #FFFFFFFF, rgb(255, 255, 255), rgba(255, 255, 255, 1). Case-insensitive.
<span></span>| colors | array of strings | Valid colours defined here will be used to set colours of specific slices of the wheel, in order. You can use empty strings to skip slices | Takes priority over the gradient (covers the gradient where defined). Repeats itself if there are more slices than defined colours. Supported colour formats include: #FFF, #FFFFFF, #FFFFFFFF, rgb(255, 255, 255), rgba(255, 255, 255, 1). Case-insensitive.
rewards || Array | The array of reward options | Define the rewards here. If only 1 reward is defined/available, it will be automatically picked. If there are multiple rewards available, the winner will be prompted to choose 1.
<span></span>| reward | string | The reward name |
<span></span>| rewardType | string | The type of reward | Valid options: "Exclusive", "Limited", "Limitless", "Repeated", "Game". <sup><a href="#raffletype-options">(explained bellow this table)<a></sup>. Alias: "raffleType"
<span></span>| message | string | Overrides the default reward message (Optional) | `[REWARD]` and `[SPECIFIC]` will be replaced with the reward's name and the specific reward rolled respectively
<span></span>| secret | boolean | Whether to handle specifics for this reward over whispers only, or to allow publicly (Optional) | Default: false. Use this when giving away codes for example, so that they are not displayed in the public chat.
<span></span>| ignore | boolean | Whether to ignore this reward (Optional) | Default: false. Use this to easily toggle a reward's availability.
<span></span>| raffleFile | string | (For "Exclusive", "Repeated", and "Game" raffleTypes) The path to the actual rewards of the category | Will roll 1 reward from this file when this reward is chosen, and remove it from the file if the reward is of type Exclusive or Game
<span></span>| maximumAmount | int | (For "Limited" raffleTypes) The maximum amount of times this reward can be given out | **IMPORTANT** This requires a resultsFile to function
<span></span>| format | string | (For "Game" raffleTypes) The format in which the games are written down in your raffleFile, to allow publicly announcing the game won without revealing the code | Default: "GAME: CODE". Use GAME and CODE with separators that cannot be part of either (parts are allowed, but not as a whole). There must be some form of separation. Can also have things before and after, as long as they too are unique to the separator.

### raffleType options
- Exclusive: each reward from the associated raffleFile can be given once. Becomes unavailable if the raffleFile is empty.
- Limited: the reward can be given up to an amount specified by maximumAmount.
- Limitless: Can be given without a limit.
- Repeated: rewards are given from a file, without a limit to how many times they can be given out.
- Game: like Exclusive, but the title (GAME in the format) is announced publicly, while the CODE can be given privately.

## Wheel js settings
It's likely you don't need to change any of these.
These settings are found inside the [spinner.js](WheelSpinnerFromScratch/spinner.js) file, right at the start of it.

Property | Explanation | Default value | Notes
------- | ------- | ------- | -------
WEBSOCKET_URI | Streamer.Bot websocket address & port | "ws://127.0.0.1:8080/" | Can be found under streamer.bot's "Servers/Clients" tab
ACTION_ID | The ID of the "Wheel Winner" action | "6c00f131-30f5-4991-8e1a-eafdb5f497c8" | 
|||
leftSide | Sets the side the result is picked from | true | 
repeatColors | Whether to repeat colours | true | Used when there are more slices than specified colours. If false, the rest of the slices are filled according to the gradient.
durationRange | The time the wheel spins for | [3000, 6000] | Values are in milliseconds. Minimum first, maximum second. If you want a specific duration instead of a range, set both values to that number.
fontCase | The case to use for the entries | {"lower": false, "upper": false, "original": true} | Set the one you want to `true` and the rest to `false`. lower/upper = entry text will be in lower/uppercase respectively. original keeps the original casing. Doesn't affect how the winner result will be displayed.

# Commands
These are the default commands of the extension.

If you change how people can join your giveaway, make sure to reflect that in the Start Giveaway action (change the value `joinCommand` at the beginning of the last `Execute C#` subaction, or pass it as an argument of that name)

Command Name | Trigger | Explanation | Aliases | Permissions | Notes
------- | ------- | ------- | ------- | ------- | -------
Cancel Giveaway | `!cancelgiveaway` | Cancels a running giveaway | `!cga` | Moderators | Make sure the Giveaway action queues are cleared before starting a new giveaway, or you may get double prints and unexpected behaviour.
Check Giveaway Time Left | `!gtime` | Prints how long is left to join the giveaway | `!giveawaytime`, `!cgt`, `!checkGiveawayTime` | Anyone | 
Join Giveaway | `!giveaway` | Joins the running giveaway | | Anyone | Is in its own commands category (`Giveaway Join`), separate to the others. The first alias listed will be used in prints prompting users to join the giveaway.
Manual Giveaway Winner | `!pickWinner` | Allows picking a winner manually | `!pgw` | Moderators | Pass the winning user as a first argument when using this command (e.g. `!pgw @SuperTheUnderDog`).
Reroll Giveaway Winner | `!rerollGiveaway` | Rerolls the giveaway | `!rga` | Moderators | Uses the same list of entrants from the last-run giveaway (minus the winner from last time, if the `removeWinnerFromPool` setting is true)
Start Giveaway | `!startGiveaway` | Starts a giveaway | `!sga` | Moderators | Can accept a duration as its first argument, and a settings file index as its second argument.


# Customization ideas & suggestions
There are many ways you can customize the giveaways beyond the scope of a settings file!
For example, you can:
- Add custom sounds to the wheel, to be played before, during, and after it spins!
- Make a custom winner action, to automatically trigger some effect

# Thanks
With thanks to [DKlarations](https://www.twitch.tv/dklarations) and his community over on Twitch for helping with testing and feature suggestions!

Wheel inspired by the [extention](https://extensions.streamer.bot/docs?topic=353) by [Lyfesaver74](https://www.twitch.tv/lyfesaver74) & [Whipstickgostop](https://www.twitch.tv/whipstickgostop)
