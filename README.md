This is more for me just customizing chat. While initially I started with streamlabs, I have since switched to stream elements.

## Streamlabs instructions
In the chat widget, plop in the html, css, and js in the appropriate places.

I won't be updating this one anymore so if they change their api, you'll have to do your own digging.

### Notes

You can do special things for a user if you use the `data-from="user_nameHere"`

inside of `onEventRecieveHandler` you get an object containing the message. Some interesting paths from `detail`:
* `body` is the message
* `command` looks like the message id
* `from` looks like the ID of the user
* tags has a bunch of stuff
  * `mod`  is "0" for non mod
  * `subscriber` I think has the sub tier. "0" for non sub
  * `badges` have a bunch of stuff. It is a comma separated list
    * `vip/1` means they are a vip
    * `found/0` means they are a founder
    * `premium/1` is a prime

You need to get a user's twitch id for custom chat. You can use https://www.streamweasels.com/support/convert-twitch-username-to-user-id/ to get it.


## Stream elements instructions
First get the twitch bubbles overlay https://www.youtube.com/watch?v=RbG10UmKaqM

My code is based off of https://github.com/zaytri/stream-elements-widgets/tree/main/DynamicChatBubbles but adds classes and some css.

Just copy over the css and js into the editor. If you want stuff for users you'll need something like this: 
```
window.idToClassMap = {
	'00000000': 'class-goes-here',
};
```







