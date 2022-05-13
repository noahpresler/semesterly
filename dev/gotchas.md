* You need to have secrets for parsing courses and logging in, please ask the current
  team lead if you do not have these.

* If you're working with Facebook login, you need to be on HTTPS. This means using
  `https://jhu.sem.ly` instead of `http://localhost:8000`. Notice that there's no port
  number in the HTTPS link. You might also have to click past `Your connection in not
  private` by going to `Advanced` and then `Proceed to jhu.sem.ly (unsafe)`.

* If your Docker container keeps running into issues with dependencies, this likely
  means that we've updated a dependency, but your container was built before this change
  was made. You can fix this with `docker-compose up --build`.

* `ImmatureSignatureError` - check if your timezone is correct with `date`. You might
  need to reset it with `sudo hwclock -s`.

* Sometimes your docker image is just wrong for no reason; you can completely wipe it
  with `docker system prune -a` and then `docker-compose up`.