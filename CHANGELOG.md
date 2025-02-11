# Changelog
All notable changes to this project will be documented in this file.

## [0.4.1] - 2023-03-20

*HTTP request bug fixes*

### Changed

- Fixed crash if outgoing http request does not work

## [0.4.0] - 2023-01-23

*HTTP Parameter Pollution, bug fixes and more*

### Added

- HTTP Parameter Pollution module - Replaces array parameters with their last value (req.query must be set by a web framework)
- README.md with module descriptions to [lib/modules](lib/modules/)
- Issue templates and [CONTRIBUTING.md](CONTRIBUTING.md)

### Changed

- Fixed critical bug in "Block Tor Exit Nodes" module
- Improved tests and updated examples
- Code refactoring

## [0.3.1] - 2022-12-17

*Security Update*

### Changed

- Update dependencies to fix CVE-2022-24999 (only devDependencies affected)
- Improve prototype pollution detection

## [0.3.0] - 2022-11-06

*Hooks, log request method, improvements and bug fixes.*

### Added

- Added Pre- and Post-Block-Hooks, which makes it possible, for example, to have your own whitelist rules or notifications.
- Log request method
- Validate ip addresses in cidr notation before adding to search crawler whitelist
- Example of how to send notifications when a request is blocked
- Bug fix: Remove unicode character "Zero Width Space" (200B) from bing ip adresses

### Changed

- Bug fix: replace quotation marks in logs (user agent and url)
- Remove `googleusercontent.com` from trusted urls for fake search crawler detection
- Remove `Not` and `Petalbot` from bad bot list

## [0.2.0] - 2022-10-23

*The second beta release.*

### Added

- Fake search crawlers module: Blocks crawlers pretending to be a bot from major search engines or internet companies
- Modules can now have a check method with callback
- Added Security.md

### Changed

- UptimeRobot and archive.org are not longer blocked
- Remove quotation marks in url or useragent when logging
- README.md updates

## [0.1.0] - 2022-10-03

*This is the initial beta release.*