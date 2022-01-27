#Heavenly Dao bot

This bots listens to the GitHub webhooks on the WuxiaCraft mod github repositories whenever a new commit is made. With that information it keeps the official WuxiaCraft discord server up to date with the content recently forged in the last commits of the main branch of the repository.

###Commands

`dao!hello`: Sends a very characteristc hello message back to the user.
`dao!broadhello`: Sends a very characteristc hello message to the whole text channel (time specific and not mentions) (can only be used by admin)
`dao!refresh`: Makes this bot edit the content on the mod content channels by going into github and get all the content anew. (It already does that when content is updated so)
`dao!query <type> <name>`: tired of using the discord search button? use this command to get the content (if it exists).