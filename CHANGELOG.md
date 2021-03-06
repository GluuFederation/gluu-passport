# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.4.0](https://github.com/GluuFederation/gluu-passport/compare/v4.3.6...v4.4.0) (2021-02-22)


### Features

* **app-factory.js:** added rate-limiting facility ([51b6ba3](https://github.com/GluuFederation/gluu-passport/commit/51b6ba3c5da71a955ecef232d4e6c2cfa8c3c2e5)), closes [#139](https://github.com/GluuFederation/gluu-passport/issues/139)


### Bug Fixes

* **app:** add csrf middleware ([ef71ec4](https://github.com/GluuFederation/gluu-passport/commit/ef71ec434c54a5ce32a3aea87a83558e13bbdfb0)), closes [#140](https://github.com/GluuFederation/gluu-passport/issues/140)
* **app:** generate random secret for session middleware ([c6202ad](https://github.com/GluuFederation/gluu-passport/commit/c6202ad464f2f1b311c965d28b5db49b5078ac49)), closes [#144](https://github.com/GluuFederation/gluu-passport/issues/144)
* **app-factory.js:** add missing parenthesis to randomSecret() ([2ff8a29](https://github.com/GluuFederation/gluu-passport/commit/2ff8a29f35382eedb1560d324f8306fed8effd27))
* **app-factory.js:** fix location undefine and req.flash function problem ([6d10f9b](https://github.com/GluuFederation/gluu-passport/commit/6d10f9ba8be788ef4265c550b82996bfd0872000)), closes [#170](https://github.com/GluuFederation/gluu-passport/issues/170) [#173](https://github.com/GluuFederation/gluu-passport/issues/173)
* **app-factory.js:** remove undeeded csurf middleware ([2b2152f](https://github.com/GluuFederation/gluu-passport/commit/2b2152f6483121dbb46b4dbda022e05de4aeb4e7)), closes [#169](https://github.com/GluuFederation/gluu-passport/issues/169)
* **husky:** add missing .huskyrc.json ([990ce91](https://github.com/GluuFederation/gluu-passport/commit/990ce911bb442c4c9fdfdc5aaec4fc42e1851a45))
* **logging.js:** add propper code for assigning empty string to msg ([9846f23](https://github.com/GluuFederation/gluu-passport/commit/9846f2314592463ceeae23a8b6bf45dc647df6bd))
* **routes.js:** remove metadata input name on outgoing request ([1738306](https://github.com/GluuFederation/gluu-passport/commit/1738306ec44daf5e3e5a0b31852a68149f63071e)), closes [#137](https://github.com/GluuFederation/gluu-passport/issues/137)
* **routes.js:** remove provider name from error message to avoid cross script ([577daaa](https://github.com/GluuFederation/gluu-passport/commit/577daaacefbb10075fbdd2b5753c7e76f90b418c)), closes [#137](https://github.com/GluuFederation/gluu-passport/issues/137)
* **routes.js:** remove received input from error output msg ([4c7f204](https://github.com/GluuFederation/gluu-passport/commit/4c7f2044afbb7a61ada9b17ded9baad80c24ccbe)), closes [#137](https://github.com/GluuFederation/gluu-passport/issues/137)
* **uma.js:** fixed form data send problem ([478b452](https://github.com/GluuFederation/gluu-passport/commit/478b4528ed793f22b87371b985d7a9f448269101)), closes [#205](https://github.com/GluuFederation/gluu-passport/issues/205)

### [4.3.8](https://github.com/GluuFederation/gluu-passport/compare/v4.3.7...v4.3.8) (2020-12-10)


### Bug Fixes

* **app-factory.js:** fix location undefine and req.flash function problem ([6d10f9b](https://github.com/GluuFederation/gluu-passport/commit/6d10f9ba8be788ef4265c550b82996bfd0872000)), closes [#170](https://github.com/GluuFederation/gluu-passport/issues/170) [#173](https://github.com/GluuFederation/gluu-passport/issues/173)
* **app-factory.js:** remove undeeded csurf middleware ([2b2152f](https://github.com/GluuFederation/gluu-passport/commit/2b2152f6483121dbb46b4dbda022e05de4aeb4e7)), closes [#169](https://github.com/GluuFederation/gluu-passport/issues/169)

### [4.3.7](https://github.com/GluuFederation/gluu-passport/compare/v4.3.6...v4.3.7) (2020-11-25)


### Bug Fixes

* **app:** add csrf middleware ([ef71ec4](https://github.com/GluuFederation/gluu-passport/commit/ef71ec434c54a5ce32a3aea87a83558e13bbdfb0)), closes [#140](https://github.com/GluuFederation/gluu-passport/issues/140)
* **app:** generate random secret for session middleware ([c6202ad](https://github.com/GluuFederation/gluu-passport/commit/c6202ad464f2f1b311c965d28b5db49b5078ac49)), closes [#144](https://github.com/GluuFederation/gluu-passport/issues/144)
* **app-factory.js:** add missing parenthesis to randomSecret() ([2ff8a29](https://github.com/GluuFederation/gluu-passport/commit/2ff8a29f35382eedb1560d324f8306fed8effd27))
* **husky:** add missing .huskyrc.json ([990ce91](https://github.com/GluuFederation/gluu-passport/commit/990ce911bb442c4c9fdfdc5aaec4fc42e1851a45))
* **logging.js:** add propper code for assigning empty string to msg ([9846f23](https://github.com/GluuFederation/gluu-passport/commit/9846f2314592463ceeae23a8b6bf45dc647df6bd))
* **routes.js:** remove metadata input name on outgoing request ([1738306](https://github.com/GluuFederation/gluu-passport/commit/1738306ec44daf5e3e5a0b31852a68149f63071e)), closes [#137](https://github.com/GluuFederation/gluu-passport/issues/137)
* **routes.js:** remove provider name from error message to avoid cross script ([577daaa](https://github.com/GluuFederation/gluu-passport/commit/577daaacefbb10075fbdd2b5753c7e76f90b418c)), closes [#137](https://github.com/GluuFederation/gluu-passport/issues/137)
* **routes.js:** remove received input from error output msg ([4c7f204](https://github.com/GluuFederation/gluu-passport/commit/4c7f2044afbb7a61ada9b17ded9baad80c24ccbe)), closes [#137](https://github.com/GluuFederation/gluu-passport/issues/137)

### [4.3.6](https://github.com/GluuFederation/gluu-passport/compare/v4.3.5...v4.3.6) (2020-10-31)

### Bug Fixes

* **routes.js:** add extended option to urlencode function call ([74ae36c](https://github.com/GluuFederation/gluu-passport/commit/74ae36ca692423130bab5adccc7222c7fd8dc2b1)), closes [#126](https://github.com/GluuFederation/gluu-passport/issues/126)
* solved the provider update strategy problem [#119](https://github.com/GluuFederation/gluu-passport/issues/119) ([3c4f725](https://github.com/GluuFederation/gluu-passport/commit/3c4f725003d2bfec1f8677b51b19b6ff01b512a5))
