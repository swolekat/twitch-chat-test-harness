# twitch-chat-test-harness
Test harness for testing twitch skins

This is for the streamlabs obs widget.

## Notes

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
    
    
    
    
    {"priority":10,"pic":"","from":"swolekat","body":"test","command":"PRIVMSG","tags":{"badge-info":"subscriber/8","badges":"broadcaster/1,subscriber/6","client-nonce":"6ce14a4b1bcb4b90cbd463d9aed76dc7","color":"#008000","display-name":"swolekat","emotes":"","flags":"","id":"44368632-f65c-4fe1-848c-5719e38587e0","mod":"0","room-id":"583041704","subscriber":"1","tmi-sent-ts":"1633223068407","turbo":"0","user-id":"583041704","user-type":""},"payload":{"raw":"@badge-info=subscriber/8;badges=broadcaster/1,subscriber/6;client-nonce=6ce14a4b1bcb4b90cbd463d9aed76dc7;color=#008000;display-name=swolekat;emotes=;flags=;id=44368632-f65c-4fe1-848c-5719e38587e0;mod=0;room-id=583041704;subscriber=1;tmi-sent-ts=1633223068407;turbo=0;user-id=583041704;user-type= :swolekat!swolekat@swolekat.tmi.twitch.tv PRIVMSG #swolekat :test","tags":{"badge-info":"subscriber/8","badges":"broadcaster/1,subscriber/6","client-nonce":"6ce14a4b1bcb4b90cbd463d9aed76dc7","color":"#008000","display-name":"swolekat","emotes":"","flags":"","id":"44368632-f65c-4fe1-848c-5719e38587e0","mod":"0","room-id":"583041704","subscriber":"1","tmi-sent-ts":"1633223068407","turbo":"0","user-id":"583041704","user-type":""},"prefix":"swolekat!swolekat@swolekat.tmi.twitch.tv","command":"PRIVMSG","params":["#swolekat"],"crlf":"test"},"owner":true,"subscriber":true,"userType":"","platform":"twitch_account","platformAccountId":null,"messageId":"44368632-f65c-4fe1-848c-5719e38587e0","access_token":null,"to":"#swolekat"}