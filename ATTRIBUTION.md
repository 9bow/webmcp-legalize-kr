# Data attribution

Korean Law Review Workbench uses Korean statute titles, archived statute text, and revision history from the following sources:

- Official source: [Korean Law Information Center](https://www.law.go.kr), operated by the Korea Ministry of Government Legislation.
- Archive: [Legalize-KR Korean statute repository](https://github.com/legalize-kr/legalize-kr).

The bundled `public/data/laws.json` file contains statute titles and repository paths derived from the public Legalize-KR archive. Statute bodies are not bundled with this application. They are retrieved on demand from immutable Git revisions and displayed with both the archived revision URL and the official current-source URL.

Korean government works may be reused under the applicable public-work terms. To take a conservative approach, this application displays the institution, source URL, requested archive date, and immutable revision for every retrieved text. The [Korea Open Government License guide](https://www.kogl.or.kr/info/licenseType1.do) describes the attribution condition used for Type 1 public works.

The MIT license in this repository applies to the application source code only. It does not replace or modify the terms that apply to the underlying statute text or third-party services.
