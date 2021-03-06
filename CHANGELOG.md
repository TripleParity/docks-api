# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
- Database is now persistent using Docker volumes ([#53])
- Two-factor authentication can be optionally added to user accounts ([#67])

## [0.2.0] - 2018-07-20
### Added
- `/user` endpoint for CRUD operations on users ([#28])
- `/stack` endpoint for CRUD operations on stacks

## [0.1.0]
### Added
- Integration testing using [frisby] and [jest] ([#41])
- API Specification for Docks following [API Blueprint] ([#41])

### Changed
- Check credentials in database instead of only checking `admin/admin` when requesting a JWT ([#29])

### Fixed
- Wait for database before starting Docks

## [0.0.2] - 2018-05-11
- Demo 2 release

## 0.0.1 - 2018-04-14
- Demo 1 release

[Unreleased]: https://github.com/TripleParity/docks-api/compare/0.2.0...HEAD
[0.2.0]: https://github.com/TripleParity/docks-api/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/TripleParity/docks-api/compare/0.0.2...0.1.0
[0.0.2]: https://github.com/TripleParity/docks-api/compare/0.0.1...0.0.2

[#41]: https://github.com/TripleParity/docks-api/issues/41
[#28]: https://github.com/TripleParity/docks-api/issues/28
[#29]: https://github.com/TripleParity/docks-api/issues/29

[frisby]: https://www.frisbyjs.com/
[jest]: https://facebook.github.io/jest/
[API Blueprint]: https://apiblueprint.org/