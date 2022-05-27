// CUSTOM SWOLEKAT CODE STARTS HERE

// todo put your idToClass map here

const classFromObjMap = {
'mod': (badges) => {
    return badges.find(b => b.type === 'moderator');
},
'sub': (badges) => {
    return badges.find(b => b.type === 'subscriber');
},
'vip': (badges) => {
    return badges.find(b => b.type === 'vip');
},
'founder': (badges) => {
    return badges.find(b => b.type === 'founder');
},
'prime': (badges)  => {
    return badges.find(b => b.type === 'premium');
},
'owner': (badges) => {
    return badges.find(b => b.type === 'broadcaster');
},
'no-audio': (badges) => {
    return badges.find(b => b.type === 'no_audio');
},
'no-video': (badges) => {
    return badges.find(b => b.type === 'no_video');
},
};

// custom. this is used in the BubbleComponent function
function getBubbleClass(userId, badges) {
    if(window.idToClassMap && idToClassMap[userId]){
        return window.idToClassMap[userId];
    }

    return Object.keys(classFromObjMap).reduce((sum, key) => {
        const func = classFromObjMap[key];
        if(!func(badges, userId)){
            return sum;
        }
        return `${sum} ${key}`
    }, '').trim();
}

const classFromTextMap = {
    'all-caps': (textContent) => {
        return textContent.every(item => !item.data || item.data === item.data.toUpperCase());
    },
    'bored': (textContent) => {
        return textContent.some(item => item.data && item.data.indexOf('bored') !== -1);
    },
};

function getTextClasses(parsedText) {
    const textContent = parsedText.filter(item => item.type === 'text');
    return Object.keys(classFromTextMap).reduce((sum, key) => {
        const func = classFromTextMap[key];
        if(!func(textContent)){
            return sum;
        }
        return `${sum} ${key}`
    }, '').trim();
}

const ZERO_WIDTH_EMOTES = [
'SnowTime',
'RainTime',
'PETPET',
'SteerR',
    'Wave',
    'ricardo',
    'SpongebobWindow',
    'pepehhoodie',
    'BlowKiss',
    'gunsOut',
    'Tex',
    'AYAYAHair',
    'SweatTime',
    'binoculars',
    'Pick',
    'Partyhat',
    'GunPoint',
    'LunchTime',
    '7Salute',
    'KAREN',
    'SPEED',
    'WEEB',
    'DUM',
    'ShowerTime',
    'MathTime',
    'DoesntKnow',
    'BONK',
    'MoneyRain',
    'ShyTime',
    'Rage',
    'WICKEDglasses',
    'HACKS',
    'vp',
    'Fire',
    'TakingNotes',
    'Love',
    'SPEED',
];

function isEmoteZeroWidth(emoteText){
return ZERO_WIDTH_EMOTES.includes(emoteText);
}

const isSpoiler = (parsedText) => {
    const firstTextElement = parsedText.find(({type, data}) => type !== 'emote' && !!data && typeof data === 'string');
    if(!firstTextElement){
        return false;
    }
    const parsedData = firstTextElement.data.toLowerCase()
    return parsedData.startsWith('spoiler');
};

const spoilerifyText = (text) => {
    return text.replace(/\S/g, '█');
};

// CUSTOM SWOLEKAT CODE ENDS HERE


const DEFAULT_COLORS = [
'#FF4A80', '#FF7070', '#FA8E4B', '#FEE440',
'#5FFF77', '#00F5D4', '#00BBF9', '#4371FB',
'#9B5DE5', '#F670DD',
]

let FieldData = {}
const Widget = {
width: 0,
height: 0,
cooldown: false,
raidActive: false,
raidTimer: null,
userMessageCount: {},
soundEffects: [],
messageCount: 0,
pronouns: {},
pronounsCache: {},
}

const PRONOUNS_API = {
base: 'https://pronouns.alejo.io/api/',
user: (username) => `users/${username}`,
pronouns: 'pronouns',
}

// ---------------------------
//    Widget Initialization
// ---------------------------

window.addEventListener('onWidgetLoad', async obj => {
loadFieldData(obj.detail.fieldData)

conditionalMainClass('dark-mode', FieldData.darkMode)
conditionalMainClass('custom-message-colors', FieldData.useCustomMessageColors)
conditionalMainClass('custom-border-colors', FieldData.useCustomBorderColors)
conditionalMainClass('custom-pronouns-badge-colors', FieldData.pronounsBadgeCustomColors)

if (FieldData.pronounsMode !== 'off') {
    await getPronouns()
}

if (FieldData.previewMode) sendTestMessage(10, 500)
})

function loadFieldData(data) {
FieldData = data

const specificUsersSoundGroups = Array(10).fill('specificUsersSoundGroup').map((text, i) => `${text}${i + 1}`)
processFieldData(
    value => stringToArray(value),
    'ignoreUserList',
    'ignorePrefixList',
    'allowUserList',
    'allowedStrings',
    ...specificUsersSoundGroups
)

processFieldData(
    value => value === 'true',
    'includeEveryone',
    'includeSubs',
    'includeVIPs',
    'includeMods',
    'emoteOnly',
    'highlightOnly',
    'darkMode',
    'useCustomMessageColors',
    'useCustomBorderColors',
    'previewMode',
    'largeEmotes',
    'showBadges',
    'fixedWidth',
    'pronounsLowercase',
    'pronounsBadgeCustomColors',
)

const soundData = {}
for (let i = 1; i <= 10; i++) {
    const group = FieldData[`soundGroup${i}`]
    const specificUsers = FieldData[`specificUsersSoundGroup${i}`]
    const isSpecific = specificUsers.length > 0
    // specific-index so multiple specifics don't override each other
    const userLevel = isSpecific ? `specific-${i}` : FieldData[`userLevelSoundGroup${i}`]
    const messageType = FieldData[`messageTypeSoundGroup${i}`]
    if (group && group.length > 0) {
        if (!soundData[userLevel]) {
            soundData[userLevel] = {}
        }

        if (isSpecific) {
            soundData[userLevel].users = specificUsers
        }

        if (!soundData[userLevel][messageType]) {
            soundData[userLevel][messageType] = []
        }

        soundData[userLevel][messageType].push(...group)
    }
}

Widget.soundEffects = Object.entries(soundData).reduce((acc, entry) => {
    const [userLevel, { users, ...messageTypes }] = entry
    for (const [messageType, soundEffects] of Object.entries(messageTypes)) {
        acc.push({
            userLevel, messageType, soundEffects, users,
            order: soundSortOrder(userLevel, messageType)
        })
    }
    return [...acc]
}, []).sort(({ order: a }, { order: b }) => {
    // sort by userLevel (0) then by messageType (1)
    if (a[0] !== b[0]) return b[0] - a[0]
    else return b[1] - a[1]
})
}

function processFieldData(process, ...keys) {
for (const key of keys) {
    FieldData[key] = process(FieldData[key])
}
}

function stringToArray(string = '', separator = ',') {
return string.split(separator).reduce((acc, value) => {
    const trimmed = value.trim()
    if (trimmed !== '') acc.push(trimmed)
    return acc
}, [])
}

function conditionalMainClass(className, condition = true) {
const main = $('main')

if (condition) main.addClass(className)
else main.removeClass(className)
}

function soundSortOrder(userLevel, messageType) {
return [userLevelSortOrder(userLevel), messageTypeSortOrder(messageType)]
}

function userLevelSortOrder(userLevel) {
switch (userLevel) {
    case 'everyone': return 0
    case 'subs': return 100
    case 'vips': return 200
    case 'mods': return 300
    default: return 1000 // assume specific
}
}

function messageTypeSortOrder(messageType) {
switch (messageType) {
    case 'highlight': return 1000
    case 'action': return 500
    case 'default': return 100
    default: return 0 // assume all
}
}

// --------------------
//    Event Handlers
// --------------------

window.addEventListener('onEventReceived', obj => {
const { listener, event } = obj.detail
switch(listener) {
    case 'message': onMessage(event)
        break
    case 'raid-latest': onRaid(event)
        break
    case 'delete-message': deleteMessage(event.msgId)
        break
    case 'delete-messages': deleteMessages(event.userId)
        break
    case 'event:test': onButton(event)
        break
    default: return
}
})

// ---------------------
//    Event Functions
// ---------------------

async function onMessage(event, testMessage = false) {
const { service } = event
const {
    // facebook
    attachment,
    // trovo
    content_data, messageId, content,
    // general
    badges = [], userId = '', nick = '',
    displayName: name = '',
} = event.data

let {
    emotes = [], text = '', msgId = '',
    displayColor: color,
} = event.data

let pronouns = null
if (FieldData.pronounsMode !== 'off') {
    if (testMessage) {
        const allPronounKeys = Object.keys(Widget.pronouns)
        const randomPronounKey = allPronounKeys[random(0, allPronounKeys.length - 1)]
        pronouns = Widget.pronouns[randomPronounKey]
    } else if (service === 'twitch') {
        pronouns = await getUserPronoun(nick)
    }
}

if (pronouns && FieldData.pronounsLowercase) {
    pronouns = pronouns.toLowerCase()
}

// handle facebook
if (service === 'facebook' && attachment && attachment.type === 'sticker') {
    const { url, target } = attachment
    text = "sticker"
    emotes.push({
        "type": "sticker",
        "name": text,
        "id": target.id,
        "gif": false,
        "urls": {
            "1": url,
            "2": url,
            "4": url
        },
        "start": 0,
        "end": text.length
    })
}

// handle trovo
if (service === 'trovo') {
    // remove messages from before the widget was loaded... idk why trovo sends these
    if (!content_data) return

    msgId = messageId
    text = content
    color = undefined
}

// Filters
if (FieldData.raidCooldown > 0 && !Widget.raidActive) return
if (FieldData.raidCooldown < 0 && Widget.raidActive) return
if (hasIgnoredPrefix(text)) return
if (!passedMinMessageThreshold(userId)) return
if (FieldData.allowUserList.length && !userListIncludes(FieldData.allowUserList, name, nick)) return
if (userListIncludes(FieldData.ignoreUserList, name, nick)) return
if (!hasIncludedBadge(badges)) return
if (FieldData.allowedStrings.length && !FieldData.allowedStrings.includes(text)) return

const messageType = getMessageType(event.data)
if (FieldData.highlightOnly && messageType !== 'highlight') return

const parsedText = parse(htmlEncode(text), emotes)
const emoteSize = calcEmoteSize(parsedText)
if (FieldData.emoteOnly && emoteSize === 1) return

if (FieldData.messageCooldown) {
    if (Widget.cooldown) {
        return
    } else {
        Widget.cooldown = true
        window.setTimeout(() => { Widget.cooldown = false }, FieldData.messageCooldown * 1000)
    }
}

const elementData = {
    parsedText, name, emoteSize,
    messageType, msgId, userId,
    color, badges, pronouns,
}

// Render Bubble
if (FieldData.positionMode === 'random') {
    $('main').append(BubbleComponent(elementData))
} else {
    $('main').prepend(BubbleComponent(elementData))
}
const currentMessage = `.bubble[data-message-id="${msgId}"]`

// Calcute Bubble Position
window.setTimeout(_ => {
    const height = $(currentMessage).outerHeight()
    let maxWidth = FieldData.fixedWidth ? FieldData.maxWidth : $(`${currentMessage} .message-wrapper`).width() + 1
    const minWidth = $(`${currentMessage} .username`).outerWidth()

    $(`${currentMessage} .message`).css({
        '--dynamicWidth': Math.max(minWidth, maxWidth),
    })

    if (FieldData.positionMode === 'random') {
        // I'm not entirely sure why the + 30 is necessary,
        // but it makes the calculations work correctly
        let xMax = Math.max(minWidth, maxWidth) + 30

        if (FieldData.theme === 'animal-crossing') {
            xMax += 15 // due to margin-left 15 on .message
        }

        const [left, top] = calcPosition(xMax, height)

        window.setTimeout(_ => {
            $(currentMessage).css({ left, top })
        }, 300)
    }
}, 300)

// Get Sound
let sound = null
const soundUrls = getSound(nick, name, badges, messageType)
if (soundUrls) {
    sound = new Audio(soundUrls[random(0, soundUrls.length - 1)])
    sound.volume = parseInt(FieldData.volume) / 100
}

// Show Bubble and Play Sound
window.setTimeout(_ => {
    Widget.messageCount++
    if (soundUrls) sound.play()
    $(currentMessage).addClass('animate')
    $(currentMessage).addClass(FieldData.animation)
    if (FieldData.positionMode === 'list') $(currentMessage).css({ position: 'relative' })

    // Max message handling
    if (FieldData.maxMessages > 0 && Widget.messageCount > FieldData.maxMessages) {
        const oldestMsgId = FieldData.positionMode === 'random'
            ? $('.bubble:not(.expired)').first().attr('data-message-id')
            : $('.bubble:not(.expired)').last().attr('data-message-id')
        const selector = `.bubble[data-message-id="${oldestMsgId}"]`

        $(selector).addClass('expired')
        $(selector).fadeOut('fast', _ => deleteMessage(oldestMsgId))
    }

    if (FieldData.lifetime > 0) {
        window.setTimeout(_ => {
            deleteMessage(msgId)
        }, FieldData.lifetime * 1000 )
    }
}, FieldData.delay * 1000)
}

function onRaid(event) {
if (FieldData.raidCooldown === 0) return
if (event.amount < FieldData.raidMin) return

// Reset timer if another raid happens during an active raid timer
clearTimeout(Widget.raidTimer)

Widget.raidActive = true
Widget.raidTimer = window.setTimeout(() => {
    Widget.raidActive = false
}, Math.abs(FieldData.raidCooldown) * 1000)
}

function deleteMessage(msgId) {
const messages = $(`.bubble[data-message-id="${msgId}"]`)
Widget.messageCount -= messages.length
messages.remove()
}

function deleteMessages(userId) {
const messages = $(`.bubble[data-user-id="${userId}"]`)
Widget.messageCount -= messages.length
messages.remove()
}

function onButton(event) {
const { listener, field, value } = event

if (listener !== 'widget-button' || value !== 'zaytri_dynamicchatbubbles') return

switch(field) {
    case 'testMessageButton': sendTestMessage()
        break
    default: return
}
}

const TEST_USER_TYPES = [
{ name: 'User', badges: [] },
{
    name: 'Moderator',
    badges: [{
        type: 'moderator',
        url: 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/3'
    }],
},
{
    name: 'VIP',
    badges: [{
        type: 'vip',
        url: 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/3'
    }],
},
]

function sendTestMessage(amount = 1, delay = 250) {
for (let i = 0; i < amount; i++) {
    window.setTimeout(_ => {
        const number = numbered.stringify(random(1, 10))
        const userType = TEST_USER_TYPES[random(0, TEST_USER_TYPES.length - 1)]
        const name = `${userType.name}_${numbered.stringify(random(1, 10))}`
        const event = {
            data: {
                userId: name,
                tags: {},
                text: 'test',
                displayName: random(0, 1) ? name : name.toLowerCase(),
                nick: '',
                msgId: `${name}_${Date.now()}`,
                badges: userType.badges
            }
        }

        const previewMessage = FieldData.previewMessage.trim()
        if (previewMessage !== '') {
            event.data.text = previewMessage
        } else {
            const [text, emotes] = TEST_MESSAGES[random(0, TEST_MESSAGES.length - 1)]
            event.data.text = text
            event.data.emotes = emotes
        }

        let messageType = 1
        switch(FieldData.previewType) {
            case 'random': messageType = random(1, 3)
                break
            case 'action': messageType = 2
                break
            case 'highlight': messageType = 3
                break
            default: messageType = 1
        }

        if (messageType === 2) {
            event.data.isAction = true
        } else if (messageType === 3) {
            event.data.tags['msg-id'] = 'highlighted-message'
        }
        onMessage(event, true)
    }, i * delay)
}
}

// -------------------------
//    Component Functions
// -------------------------

function BubbleComponent(props) {
const {
    parsedText, emoteSize,
    messageType, msgId, userId,
    color: userColor, badges,
    pronouns,
} = props

let {
    name,
} = props

if (FieldData.pronounsMode === 'suffix' && pronouns) {
    name = `${name} (${pronouns})`
}

const color = userColor || generateColor(name)
const tColor = tinycolor(color)

// based on https://stackoverflow.com/a/69869976
const isDark = tColor.getLuminance() < 0.4

const filteredElements = parsedText.filter(({ type, data }) => {
    return type === 'emote' || (!!data && typeof data === 'string' && !!data.trim());
})

const parsedElements = [];
const messageIsSpoiler = isSpoiler(parsedText);

filteredElements.forEach(({data, type}, index) => {
    if(type !== 'emote'){
        if(messageIsSpoiler){
            parsedElements.push(TextComponent(spoilerifyText(data)));
            return;
        }
        parsedElements.push(TextComponent(data));
        return;
    }
    if(isEmoteZeroWidth(data.name) && data.rendered){
        return;
    }
    let nextElementIndex = index + 1;
    let nextElement = filteredElements[nextElementIndex];
    const children = [];
    while(nextElementIndex <= filteredElements.length - 1 && (nextElement && nextElement.type === 'emote' && isEmoteZeroWidth(nextElement.data.name))){
        children.push(nextElement.data);
        nextElement.data.rendered = true;
        nextElementIndex++;
        nextElement = filteredElements[nextElementIndex];
    }
    if(children.length === 0){
        parsedElements.push(EmoteComponent(data));
        return;
    }
    parsedElements.push(ComplexEmoteComponent(data, children));
});

let containerClasses = ['bubble', `emote-${FieldData.largeEmotes ? emoteSize : 1}`, getBubbleClass(userId, badges), getTextClasses(parsedText)]

switch (messageType) {
    case 'highlight': {
        if (FieldData.highlightStyle === 'rainbow') containerClasses.push('highlight')
        break
    }
    case 'action': {
        if (FieldData.actionStyle === 'italics') containerClasses.push('action')
        break
    }
    default: // nothing
}

if (isDark) containerClasses.push('user-color-dark')

let usernameChildren = []
if (FieldData.showBadges) {
    usernameChildren = BadgesComponent(badges)
}
if (FieldData.pronounsMode === 'badge' && pronouns) {
    usernameChildren.push(PronounsBadgeComponent(pronouns))
}
usernameChildren.push(name)

const usernameProps = {}
if (!FieldData.useCustomBorderColors) {
    usernameProps.style = {
        color: isDark
            ? tinycolor.mix(color, 'white', 85).toString()
            : tinycolor.mix(color, 'black', 85).toString()
    }
}

const bubbleChildren = [
    UsernameBoxComponent(UsernameComponent(usernameChildren, usernameProps)),
    MessageComponent(MessageWrapperComponent(parsedElements)),
]

if (FieldData.theme === 'default') {
    bubbleChildren.unshift(BackgroundComponent())
}

return Component('section', {
    class: containerClasses,
    style: { '--userColor': color },
    'data-message-id': msgId,
    'data-user-id': userId,
    children: bubbleChildren,
})
}

function BadgesComponent(badges) {
return badges.map(badge => Component('img', { class: 'badge', src: badge.url, alt: badge.type }))
}

function TextComponent(text) {
return Component('span', { class: 'text', children: text })
}

function EmoteComponent({ urls: { '4': url }, name }, isZeroWidth) {
return Component('img', { class: ['emote', isZeroWidth ? 'zero-width' : ''], src: url, alt: name })
}

function ComplexEmoteComponent(originalEmote, children) {
return Component('div', {
    class: ['complex-emote'],
    children: [
        EmoteComponent(originalEmote),
        ...children.map(child => EmoteComponent(child, true)),
    ]
});
}

const ClassComponent = (tag, className) => (children, props = {}) => Component(tag, { children, class: className, ...props })
const BackgroundComponent = ClassComponent('div', 'bubble-background')
const UsernameBoxComponent = ClassComponent('div', 'username-box')
const UsernameComponent = ClassComponent('p', 'username')
const PronounsBadgeComponent = ClassComponent('span', 'pronouns-badge')
const MessageComponent = ClassComponent('div', 'message')
const MessageWrapperComponent = ClassComponent('span', 'message-wrapper')

function Component(tag, props) {
const { children, 'class': classes, style, ...rest } = props

if (classes) rest.class = joinIfArray(classes, ' ')

if (style) rest.style = Object.entries(style)
    .map(([key, value]) => `${key}: ${value}`).join(';')

const attributes = Object.entries(rest)
    .reduce((acc, [attr, value]) => `${acc} ${attr}='${value}'`, '')
return `<${tag}${attributes}>${children !== undefined ? joinIfArray(children) : ''}</${tag}>`
}

// ----------------------------
//    Pronouns API Functions
// ----------------------------
async function getPronouns() {
const res = await get(`${PRONOUNS_API.base}${PRONOUNS_API.pronouns}`)
res.forEach(pronoun => {
    Widget.pronouns[pronoun.name] = pronoun.display
})
}

async function getUserPronoun(username) {
const lowercaseUsername = username.toLowerCase()
let pronouns = Widget.pronounsCache[lowercaseUsername]

if (!pronouns || pronouns.expire < Date.now()) {
    const res = await get(`${PRONOUNS_API.base}${PRONOUNS_API.user(lowercaseUsername)}`)
    const [newPronouns] = res
    Widget.pronounsCache[lowercaseUsername] = {
        ...newPronouns,
        expire: Date.now() + (1000 * 60 * 60) // 1 hour in the future
    }
    pronouns = Widget.pronounsCache[lowercaseUsername]
}

if (!pronouns.pronoun_id) {
    return null
}

return Widget.pronouns[pronouns.pronoun_id]
}

// ---------------------
//    Helper Functions
// ---------------------
async function get(URL) {
return await fetch(URL).then(async (res) => {
    return res.json()
})
}

function hasIgnoredPrefix(text) {
for (const prefix of FieldData.ignorePrefixList) {
    if (text.startsWith(prefix)) return true
}
return false
}

function passedMinMessageThreshold(userId) {
if (FieldData.minMessages === 0) return true

// begin counting
if (!Widget.userMessageCount[userId]) Widget.userMessageCount[userId] = 0
Widget.userMessageCount[userId]++

return Widget.userMessageCount[userId] > FieldData.minMessages
}

function userListIncludes(userList, ...names) {
const lowercaseNames = names.map(name => name.toLowerCase())
return userList.some(user => lowercaseNames.includes(user.toLowerCase()))
}

function hasIncludedBadge(badges = []) {
if (FieldData.includeEveryone) return true
if (!badges.length) return false

const includedBadges = ['broadcaster']

if (FieldData.includeSubs) includedBadges.push('subscriber', 'founder')
if (FieldData.includeVIPs) includedBadges.push('vip')
if (FieldData.includeMods) includedBadges.push('moderator')

return hasBadge(badges, ...includedBadges)
}

function isMod(badges = []) {
return hasBadge(badges, 'moderator', 'broadcaster')
}

function isVIP(badges = []) {
return hasBadge(badges, 'vip', 'broadcaster')
}

function isSub(badges = []) {
return hasBadge(badges, 'subscriber', 'founder', 'broadcaster')
}

function hasBadge(userBadges = [], ...badgeTypes) {
return userBadges.some(({ type }) => badgeTypes.includes(type))
}

function getMessageType(data) {
if (data.isAction) return 'action'
if (data.tags && data.tags['msg-id'] === 'highlighted-message') return 'highlight'
return 'default'
}

function getSound(nick, name, badges, messageType) {
for (const soundGroup of Widget.soundEffects) {
    const { userLevel, messageType: soundMessageType, users = [], soundEffects } = soundGroup
    if (soundMessageType === 'all' || soundMessageType === messageType) {
        switch(userLevel) {
            case 'everyone': return soundEffects
            case 'subs': if (isSub(badges)) return soundEffects
                break
            case 'vips': if (isVIP(badges)) return soundEffects
                break
            case 'mods': if (isMod(badges)) return soundEffects
                break
            // assume specific
            default: if (userListIncludes(users, nick, name)) return soundEffects
                break
        }
    }
}
return null
}

function parse(text, emotes) {
if (!emotes || emotes.length === 0) return [{ type: 'text', data: text }]

const regex = createRegex(emotes.map(e => htmlEncode(e.name)))

const textObjs = text.split(regex)
    .map(string => ({ type: 'text', data: string }))
const last = textObjs.pop()

const parsedText = textObjs.reduce((acc, textObj, index) => {
    return [...acc, textObj, { type: 'emote', data: emotes[index] }]
}, [])

parsedText.push(last)
return parsedText
}

function calcEmoteSize(parsedText) {
let emotesFound = 0
for (const { type, data } of parsedText) {
    if (type === 'emote') {
        if(!isEmoteZeroWidth(data?.name)) {
            emotesFound++
        }
        if (emotesFound > 1) return 2
    } else if (data.trim() !== '') return 1
}
return 4
}

// I have no idea how this works anymore but it does
// Regex is so useful but it's so confusing
// This is all to parse out the emote text
const createRegex = strings => {
const regexStrings = strings.sort().reverse()
    .map(string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
const regex = `(?<=\\s|^)(?:${regexStrings.join('|')})(?=\\s|$|[.,!])`
return new RegExp(regex, 'g')
}

function generateColor(name) {
if (!name) return DEFAULT_COLORS[0]
const value = name.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), 0)
return DEFAULT_COLORS[value % DEFAULT_COLORS.length]
}

function random(min, max) {
return Math.floor(Math.random() * (max - min + 1)) + min
}

function calcPosition(width, height) {
const main = $('main')
const widgetWidth = main.innerWidth()
const widgetHeight = main.innerHeight()
const { padding } = FieldData

// edge testing
/*-*
return [
  random(0, 1) ? padding : Math.max(padding, widgetWidth - padding - width),
  random(0, 1) ? padding : Math.max(padding, widgetHeight - padding - height),
]
/*-*/

return [
    random(padding, Math.max(padding, widgetWidth - padding - width)),
    random(padding, Math.max(padding, widgetHeight - padding - height)),
]
}

function joinIfArray(possibleArray, delimiter = '') {
if (Array.isArray(possibleArray)) return possibleArray.join(delimiter)
return possibleArray
}

const TEST_MESSAGES = [
['HYPE'],
['uwu'],
['popCat', [
    {
        "type": "bttv",
        "name": "popCat",
        "id": "60d5abc38ed8b373e421952f",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/60d5abc38ed8b373e421952f/1x",
            "2": "https://cdn.betterttv.net/emote/60d5abc38ed8b373e421952f/2x",
            "4": "https://cdn.betterttv.net/emote/60d5abc38ed8b373e421952f/3x"
        },
        "start": 0,
        "end": 6
    }
]],
['catHYPE hypeE catHYPE', [
    {
        "type": "bttv",
        "name": "catHYPE",
        "id": "6090e9cc39b5010444d0b3ff",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/1x",
            "2": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/2x",
            "4": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/3x"
        },
        "start": 0,
        "end": 7
    },
    {
        "type": "bttv",
        "name": "hypeE",
        "id": "5b6ded5560d17f4657e1319e",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/5b6ded5560d17f4657e1319e/1x",
            "2": "https://cdn.betterttv.net/emote/5b6ded5560d17f4657e1319e/2x",
            "4": "https://cdn.betterttv.net/emote/5b6ded5560d17f4657e1319e/3x"
        },
        "start": 8,
        "end": 13
    },
    {
        "type": "bttv",
        "name": "catHYPE",
        "id": "6090e9cc39b5010444d0b3ff",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/1x",
            "2": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/2x",
            "4": "https://cdn.betterttv.net/emote/6090e9cc39b5010444d0b3ff/3x"
        },
        "start": 14,
        "end": 21
    }
]],
['zaytriLOVE', [
    {
        "type": "twitch",
        "name": "zaytriLOVE",
        "id": "307974105",
        "gif": false,
        "urls": {
            "1": "https://static-cdn.jtvnw.net/emoticons/v2/307974105/default/dark/1.0",
            "2": "https://static-cdn.jtvnw.net/emoticons/v2/307974105/default/dark/2.0",
            "4": "https://static-cdn.jtvnw.net/emoticons/v2/307974105/default/dark/3.0"
        },
        "start": 0,
        "end": 9
    }
]],
['D: D: D:', [
    {
        "type": "bttv",
        "name": "D:",
        "id": "55028cd2135896936880fdd7",
        "gif": false,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/1x",
            "2": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/2x",
            "4": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/3x"
        },
        "start": 0,
        "end": 2
    },
    {
        "type": "bttv",
        "name": "D:",
        "id": "55028cd2135896936880fdd7",
        "gif": false,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/1x",
            "2": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/2x",
            "4": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/3x"
        },
        "start": 3,
        "end": 5
    },
    {
        "type": "bttv",
        "name": "D:",
        "id": "55028cd2135896936880fdd7",
        "gif": false,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/1x",
            "2": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/2x",
            "4": "https://cdn.betterttv.net/emote/55028cd2135896936880fdd7/3x"
        },
        "start": 6,
        "end": 8
    }
]],
['SCREME', [
    {
        "type": "bttv",
        "name": "SCREME",
        "id": "5fea41766b06e834ffd76103",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/5fea41766b06e834ffd76103/1x",
            "2": "https://cdn.betterttv.net/emote/5fea41766b06e834ffd76103/2x",
            "4": "https://cdn.betterttv.net/emote/5fea41766b06e834ffd76103/3x"
        },
        "start": 0,
        "end": 6
    }
]],
['toad sings but make it nightcore zaytriSCREME', [
    {
        "type": "twitch",
        "name": "zaytriSCREME",
        "id": "305161229",
        "gif": false,
        "urls": {
            "1": "https://static-cdn.jtvnw.net/emoticons/v2/305161229/default/dark/1.0",
            "2": "https://static-cdn.jtvnw.net/emoticons/v2/305161229/default/dark/2.0",
            "4": "https://static-cdn.jtvnw.net/emoticons/v2/305161229/default/dark/3.0"
        },
        "start": 33,
        "end": 44
    }
]],
['bobDance bobDance bobDance', [
    {
        "type": "bttv",
        "name": "bobDance",
        "id": "5e2a1da9bca2995f13fc0261",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/1x",
            "2": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/2x",
            "4": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/3x"
        },
        "start": 0,
        "end": 8
    },
    {
        "type": "bttv",
        "name": "bobDance",
        "id": "5e2a1da9bca2995f13fc0261",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/1x",
            "2": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/2x",
            "4": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/3x"
        },
        "start": 9,
        "end": 17
    },
    {
        "type": "bttv",
        "name": "bobDance",
        "id": "5e2a1da9bca2995f13fc0261",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/1x",
            "2": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/2x",
            "4": "https://cdn.betterttv.net/emote/5e2a1da9bca2995f13fc0261/3x"
        },
        "start": 18,
        "end": 26
    }
]],
['bongoTap', [
    {
        "type": "bttv",
        "name": "bongoTap",
        "id": "5ba6d5ba6ee0c23989d52b10",
        "gif": true,
        "urls": {
            "1": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/1x",
            "2": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/2x",
            "4": "https://cdn.betterttv.net/emote/5ba6d5ba6ee0c23989d52b10/3x"
        },
        "start": 0,
        "end": 8
    }
]],
['VoHiYo hello!', [
    {
        "type": "twitch",
        "name": "VoHiYo",
        "id": "81274",
        "gif": false,
        "urls": {
            "1": "https://static-cdn.jtvnw.net/emoticons/v2/81274/default/dark/1.0",
            "2": "https://static-cdn.jtvnw.net/emoticons/v2/81274/default/dark/2.0",
            "4": "https://static-cdn.jtvnw.net/emoticons/v2/81274/default/dark/3.0"
        },
        "start": 0,
        "end": 5
    }
]],
['TwitchUnity', [
    {
        "type": "twitch",
        "name": "TwitchUnity",
        "id": "196892",
        "gif": false,
        "urls": {
            "1": "https://static-cdn.jtvnw.net/emoticons/v2/196892/default/dark/1.0",
            "2": "https://static-cdn.jtvnw.net/emoticons/v2/196892/default/dark/2.0",
            "4": "https://static-cdn.jtvnw.net/emoticons/v2/196892/default/dark/3.0"
        },
        "start": 0,
        "end": 10
    }
]],
['MercyWing1 PinkMercy MercyWing2', [
    {
        "type": "twitch",
        "name": "MercyWing1",
        "id": "1003187",
        "gif": false,
        "urls": {
            "1": "https://static-cdn.jtvnw.net/emoticons/v1/1003187/1.0",
            "2": "https://static-cdn.jtvnw.net/emoticons/v1/1003187/1.0",
            "4": "https://static-cdn.jtvnw.net/emoticons/v1/1003187/3.0"
        },
        "start": 0,
        "end": 9
    },
    {
        "type": "twitch",
        "name": "PinkMercy",
        "id": "1003190",
        "gif": false,
        "urls": {
            "1": "https://static-cdn.jtvnw.net/emoticons/v1/1003190/1.0",
            "2": "https://static-cdn.jtvnw.net/emoticons/v1/1003190/1.0",
            "4": "https://static-cdn.jtvnw.net/emoticons/v1/1003190/3.0"
        },
        "start": 11,
        "end": 19
    },
    {
        "type": "twitch",
        "name": "MercyWing2",
        "id": "1003189",
        "gif": false,
        "urls": {
            "1": "https://static-cdn.jtvnw.net/emoticons/v1/1003189/1.0",
            "2": "https://static-cdn.jtvnw.net/emoticons/v1/1003189/1.0",
            "4": "https://static-cdn.jtvnw.net/emoticons/v1/1003189/3.0"
        },
        "start": 21,
        "end": 30
    }
]],
]

function htmlEncode(text) {
return text.replace(/[\<\>\"\'\^\=]/g, char => `&#${char.charCodeAt(0)};`)
}