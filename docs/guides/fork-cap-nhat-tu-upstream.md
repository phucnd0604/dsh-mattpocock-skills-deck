# Bản fork cá nhân: cài đặt, cập nhật khi upstream đổi

Tài liệu này nói về **bản fork** `phucnd0604/dsh-mattpocock-skills-deck`: nó khác gì bản gốc, cài thế nào,
và khi bản gốc ra bản mới thì làm gì để đưa bản mới vào mà không mất các sửa đổi của mình.

## 1. Bản gốc và bản fork

| | |
|---|---|
| Bản gốc (upstream) | `https://github.com/FeatherHunter/dsh-mattpocock-skills-deck` |
| Bản fork | `https://github.com/phucnd0604/dsh-mattpocock-skills-deck` |
| Nhánh | `main` |
| Phiên bản của fork | `0.1.0` (đặt trong `package.json` ở gốc repo và trong `package/package.json`) |
| Số commit hơn upstream | 1 commit, nằm ngay trên đầu `upstream/main` |

`package.json` ở gốc repo còn được thêm bốn thứ để cài được từ GitHub: `main`, `exports`, `dsh.client`,
và script `prepare` (script này đã có sẵn ở bản gốc, ở đây nói tới vì nó là mắt xích của việc cài đặt —
xem mục 3).

## 2. Bản fork khác gì bản gốc

Gồm ba phần:

1. **Sửa lỗi panel GitLab.** Trước đây mọi đường đọc của panel (chi tiết issue / bình luận / dò thay đổi /
   phân trang / snapshot / đổi màu nhãn / nhận việc) lấy `refId` thẳng từ `reg.describe({ cwd })`. Phòng
   GitLab chỉ điền `refId` khi người gọi đã đưa sẵn một handle có `refId`, nên panel nhận chuỗi rỗng, tự
   lùi về dùng đường dẫn thư mục làm đường dẫn project, và `glab` trả về `404 Project Not Found`; các thao
   tác đọc còn thiếu cả `exec` trong `opCtx` nên báo `exec unavailable`. Nay tất cả các đường đó đi qua
   `resolvePanelRepoRef` (đúng bước mà đường agent-tool đã làm từ trước) và `opCtx` nào cũng tự mang
   `exec`.
   - Mã nguồn: `src/shared/panel-repo-ref.ts` (file mới) cùng bảy file trong `src/host/`:
     `commentThreads.ts`, `sessionSnapshot.ts`, `sessionRefresh.ts`, `issuePage.ts`,
     `workspaceLabelColors.ts`, `handoffClaim.ts`, `index.ts`.
   - Vì sao file dùng chung nằm ở `src/shared/` chứ không nằm cạnh các file gọi nó: cổng `same-layer-import-host`
     cấm các file lá trong `src/host/` import lẫn nhau (việc nối dây thuộc về `src/host/index.ts`), nên
     chỗ dùng chung phải nâng lên tầng `shared`. Chi tiết nằm ở đầu file đó.
2. **Bỏ tiếng Trung còn sót.** Xem mục 5.
3. **Tài liệu này.**

## 3. Cài đặt

Bản gốc cài từ npm; bản fork cài từ GitHub. Cách gọn nhất là để pnpm tự build gói lúc cài — nhưng pnpm
chặn việc đó cho tới khi gói được cho phép chạy script. Vì vậy có **hai đường**, chọn một:

### Đường A — cài thẳng từ GitHub (đúng như yêu cầu)

Bước 1 (một lần cho cả máy): cài `pnpm` thành lệnh dùng được từ dòng lệnh.

```powershell
npm install -g pnpm
pnpm -v
```

Vì sao cần: khi cài từ git, pnpm tự chạy `pnpm install` bên trong gói vừa tải về rồi mới chạy `prepare`
(build). DSH có sẵn một bản pnpm nhưng chỉ có `pnpm.cjs`/`pnpm.mjs`, không có lệnh `pnpm`, nên bước đó
báo `'pnpm' is not recognized as an internal or external command` và cả lần cài đổ.

Bước 2: mở `$env:DSH_HOME\profiles\desktop\pnpm-workspace.yaml`, thêm vào mục `allowBuilds` đúng một dòng:

```yaml
allowBuilds:
  dsh-mattpocock-skills-deck@git+https://github.com/phucnd0604/dsh-mattpocock-skills-deck.git: true
```

Bước 3: cài.

```powershell
dsh plugin --profile desktop add github:phucnd0604/dsh-mattpocock-skills-deck
```

Nếu pnpm vẫn từ chối và in ra một dòng `dsh-mattpocock-skills-deck@https://codeload.github.com/…#<mã commit>: true`,
hãy dán **đúng dòng nó in** vào `allowBuilds` rồi chạy lại — dạng khoá đó gắn với từng mã commit, nên mỗi lần
cập nhật lên commit mới sẽ phải dán lại một lần (đó là lý do nên dùng dạng khoá ở bước 1, nếu nó chịu).

Bước 4: thoát hẳn DeepSeek Harness rồi mở lại (host giữ module cũ trong RAM, sửa file không có tác dụng cho
tới khi khởi động lại).

Lúc cài, pnpm sẽ chạy `prepare` của gói, tức là tự `pnpm install` + build lại toàn bộ (`package/lib`,
`package/deck`, `package/tracker`, `package/shared`, `package/scripts`). Mất khoảng một phút và cần mạng
(đợt đầu tải devDependencies).

Hai điều không được bỏ khỏi `package.json` ở gốc repo, nếu không plugin cài xong sẽ không chạy:

- **script `prepare`** — không có nó thì không ai build, `package/lib` rỗng.
- **`"files": ["package"]`** — pnpm đóng gói gói cài từ git theo kiểu npm (đọc `.gitignore`), mà
  `package/shared/`, `package/deck/`, `package/tracker/` đều bị `.gitignore` chặn; thiếu dòng `files` này
  thì gói cài về chỉ có `package/lib`, còn lúc chạy thì `package/lib/index.js` import
  `../tracker/...`/`../shared/...` không thấy đâu và cả plugin không nạp được.

### Đường B — nối vào bản clone sẵn trên máy (nhanh, không phụ thuộc pnpm)

```powershell
cd C:\Users\PHUCND\Documents\dsh-mattpocock-skills-deck
pnpm install        # lần đầu
npm run build       # sinh package/lib, package/deck, package/tracker, package/shared
```

rồi sửa mục `dependencies` trong `$env:DSH_HOME\profiles\desktop\package.json`:

```json
"dsh-mattpocock-skills-deck": "link:C:/Users/PHUCND/Documents/dsh-mattpocock-skills-deck/package"
```

Đường này không chạy script build nào của gói (link chỉ trỏ vào thư mục), nên không bị pnpm chặn. Đổi lại,
mỗi lần `git pull` phải chạy lại `npm run build`; quên là DSH vẫn chạy mã cũ.

### Kiểm tra đã cài đúng bản

```powershell
Select-String -Path "$env:DSH_HOME\profiles\desktop\node_modules\dsh-mattpocock-skills-deck\package.json" -Pattern '"version"'
Select-String -Path "$env:DSH_HOME\profiles\desktop\package.json" -Pattern 'dsh-mattpocock-skills-deck'
```

Bản đã cài phải thấy `"version": "0.1.0"`; dòng phụ thuộc phải là bản GitHub (đường A) hoặc `link:` (đường B),
không còn là số phiên bản npm.

Quay lại gói npm:

```powershell
dsh plugin --profile desktop remove dsh-mattpocock-skills-deck
dsh plugin --profile desktop add dsh-mattpocock-skills-deck@1.9.0-beta.5
```

## 4. Khi upstream ra bản mới

### Bước 0: thêm remote upstream (chỉ làm một lần)

```powershell
git remote add upstream https://github.com/FeatherHunter/dsh-mattpocock-skills-deck.git
```

### Bước 1: xem upstream mới những gì

```powershell
git fetch upstream main
git log --oneline upstream/main -10
```

### Bước 2: đưa commit của mình lên trên bản mới

Cách gọn lịch sử (giữ đúng một commit hơn upstream):

```powershell
git rebase upstream/main
```

> **Quy tắc của repo:** `AGENTS.md` cấm agent tự chạy các lệnh đổi lịch sử (`git rebase`, `git push --force`,
> `git reset --hard`…). Các lệnh trong tài liệu này là việc của **người**, hoặc của agent khi đã được bạn cho
> phép rõ ràng. Không muốn đổi lịch sử thì dùng cách dưới — đổi lại, lịch sử có thêm một commit merge.

```powershell
git merge upstream/main
```

Khi `rebase` báo xung đột, gần như chắc chắn rơi vào một trong ba chỗ:

| File | Vì sao xung đột | Khi giải quyết |
|---|---|---|
| `src/host/*.ts` và `src/shared/panel-repo-ref.ts` | upstream sửa cùng đoạn lấy `repoRef` | Giữ cách gọi `resolvePanelRepoRef` và `exec` trong `opCtx`; nếu upstream đã tự sửa lỗi này thì bỏ phần của mình, giữ của họ |
| `package.json`, `package/package.json` | `main` / `exports` / `dsh.client` / phiên bản `0.1.0` | Giữ phần của mình (nhớ đừng xoá `prepare`) |
| Các file đã bỏ tiếng Trung | upstream sửa cùng dòng | Lấy bản của upstream rồi bỏ tiếng Trung lại (mục 5) |

### Bước 3: kiểm tra bốn phần của fork còn nguyên

```powershell
npm install
node scripts/build.mts
# 1) chỗ sửa lỗi GitLab còn nguyên
Select-String -Path package/lib/commentThreads.js -Pattern 'resolvePanelRepoRef' | Measure-Object
# 2) gói cài từ git vẫn có script prepare (không có là cài xong thiếu package/lib)
Select-String -Path package.json -Pattern '"prepare"'
# 3) phiên bản vẫn là 0.1.0 (và cổng kiểm tra cũng đang đòi đúng con số đó)
Select-String -Path package.json,package/package.json -Pattern '"version": "0.1.0"'
Select-String -Path tests/verify-config-store-package.ts -Pattern "CANDIDATE_VERSION = '0.1.0'"
# 4) tài liệu phát hành cũng phải nhắc đúng con số đó (README, README tiếng Anh, CHANGELOG)
node --import ./scripts/ts-hook.mts tests/verify-release-contract.ts | Select-Object -Last 2
```

Rồi chạy cổng kiểm tra của repo:

```powershell
npm test                # typecheck + build + toàn bộ verify-chain + smoke
npm run verify:fast     # bản nhanh, dùng khi chỉ muốn biết có vỡ gì không
```

### Bước 4: commit và đẩy lên

Gom tất cả vào **một** commit trên đầu `upstream/main`. Commit viết theo cách của repo: tiêu đề tiếng Trung,
câu trọn vẹn, nói rõ sửa gì và vì sao (xem `docs/agents/commit-convention.md`).

```powershell
git add -A
git commit -m "..."
git push origin main
```

Đã `rebase` (đổi lịch sử) thì lần đẩy này cần `--force-with-lease`; đã `merge` thì `git push` thường là đủ.

Sau khi đẩy, cập nhật bản đang cài:

```powershell
# đường A
dsh plugin --profile desktop add github:phucnd0604/dsh-mattpocock-skills-deck
# đường B
cd C:\Users\PHUCND\Documents\dsh-mattpocock-skills-deck; git pull; npm run build
```

rồi thoát hẳn DeepSeek Harness và mở lại.

### Vì sao không commit sẵn `package/lib`

Đầu ra build **không được** commit:門禁 `tests/verify-build-artifacts.ts` khẳng định trong git không có sản phẩm nào (`package/lib/`, `package/deck/`, `package/tracker/`, `package/shared/` đều bị tính là sản phẩm), nên
commit chúng sẽ làm cổng đỏ ngay. Vì vậy đầu ra phải được sinh ra lúc cài (`prepare`) hoặc lúc bạn build tay
(đường B), và không bao giờ được đẩy lên git.

## 5. Chuyện bỏ tiếng Trung

Bản gốc vốn hai thứ tiếng: mọi câu hiện cho người dùng đều có hai bản `zh` và `en`, chọn theo ngôn ngữ mà
DSH báo về. Nhánh mặc định trước đây là tiếng Trung — **chỉ khi ngôn ngữ DSH bắt đầu bằng `en` mới hiện tiếng
Anh, còn lại (kể cả `vi`) đều rơi về tiếng Trung**. Fork này đổi quy tắc đó:

- `src/client/kernel/prompts.ts` — `promptLang()`: chỉ khi locale bắt đầu bằng `zh` mới dùng tiếng Trung,
  mọi ngôn ngữ khác dùng tiếng Anh; khi không có thông tin ngôn ngữ (dialect chạy thẳng bằng Node, ví dụ test)
  vẫn giữ `zh` như cũ, để test không đổi hành vi.
- `src/host/platformChannel.ts` — dòng dò trạng thái skill trước đây ghim cứng `'zh'`, nên mấy dòng trạng thái kỹ năng luôn là tiếng Trung; nay lấy theo ngôn ngữ mà panel gửi lên.
- Chín chỗ panel gọi `wf.detect` (ChecksTab, NoRepoCard, ChainRenderer, bannerChain, slotRenderer-repo-sync,
  slotRenderer-modal-view) nay gửi kèm `lang`, và `detectionService` chuyển tiếp nó xuống tầng dò skill.

Còn lại: khoảng 1.600 câu tiếng Trung **ghi thẳng trong mã** (không đi qua bảng từ điển `zh`/`en`) ở khoảng
155 file — chủ yếu là thông báo lỗi của tầng host/tracker/deck và mô tả công cụ. Bảng từ điển `zh` phải giữ
nguyên vì có cổng `verify-locale-completeness` bắt mỗi khoá xuất hiện đúng hai lần (zh và en).

## 6. Gỡ rối

- **Panel GitLab lại báo `404 Project Not Found` hoặc `exec unavailable`**: bản đang chạy không phải bản fork
  (hoặc là bản fork nhưng đầu ra build cũ). Kiểm tra `package/lib/commentThreads.js` có `resolvePanelRepoRef`
  không, và `package.json` trong thư mục đã cài có `"version": "0.1.0"` không.
- **pnpm báo `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`**: chưa thêm dòng `allowBuilds` (mục 3, đường A). Nếu pnpm
  in ra dòng có `#<mã commit>`, dán đúng dòng đó.
- **Skill vá tay `patch-mattskill-gitlab`** (`~/.dsh/skills/patch-mattskill-gitlab`): chỉ còn cần khi dùng lại
  gói npm `1.9.0-beta.5`. Cài từ fork này thì không cần chạy nữa; chạy cũng vô hại (script sẽ báo `stale` vì
  bản fork đã sửa sẵn chỗ đó).
- **DSH không thấy plugin sau khi cài**: thoát hẳn (không chỉ đóng cửa sổ) rồi mở lại; kiểm tra dòng `bundles`
  trong `$env:DSH_HOME\profiles\desktop\package.json`.
- **Cổng phát hành đỏ sau khi đổi số phiên bản**: `tests/verify-release-contract.ts` đòi README (3 chỗ),
  `docs/README.en.md` (1 chỗ), `package/README.md` và một mục `CHANGELOG.md` nhắc đúng số phiên bản; đổi số thì
  phải cập nhật bốn chỗ đó cùng lúc.
- **Cổng UI báo thiếu Chromium**: `node node_modules/playwright/cli.js install chromium` (một lần).
