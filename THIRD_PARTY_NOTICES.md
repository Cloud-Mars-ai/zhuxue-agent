# Third-Party Notices

## Runtime Dependencies

| Component | Version / range | License / usage |
| --- | --- | --- |
| Vue | 3.5.x | MIT |
| Vue Router | 5.4.x | MIT |
| Pinia | 4.1.x | MIT |
| Element Plus | 2.14.x | MIT |
| Vant | 4.10.x | MIT |
| ECharts | 6.1.x | Apache-2.0 |
| pdfjs-dist | 6.5.x | Apache-2.0 |
| JSZip | 3.10.x | MIT / GPL-3.0 dual license; this project uses it under MIT |
| Mammoth | 1.13.x | BSD-2-Clause |
| Playwright | 1.57.x | Apache-2.0 |
| ReportLab | 4.4.x | BSD-style |

The software is provided without warranty. Package-lock and source repositories remain the authoritative version record.

## Model and Voice Services

- Text generation is accessed through the DeepSeek OpenAI-compatible API.
- Speech synthesis is accessed through StepFun StepAudio.
- Credentials are supplied through server-side environment variables and are not part of the open-source repository.
- Generated demo narration is used only inside the competition demonstration video.

## OpenMAIC

This project contains implementation ideas and adapted code derived from:

- Project: OpenMAIC (Open Multi-Agent Interactive Classroom)
- Repository: https://github.com/THU-MAIC/OpenMAIC
- Reviewed revision: `10a92d652ba7a69d2801d9c1354d33287c3142e2`
- Copyright: Copyright (c) 2026 THU-MAIC
- License: MIT

The adapted areas are primarily the two-stage course generation workflow, structured JSON validation and repair, bounded outline normalization, and generation retry patterns. The application-specific prompts, data contracts, fallback content, UI, and storage integration were rewritten for this project.

The upstream MIT license follows:

```text
MIT License

Copyright (c) 2026 THU-MAIC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
