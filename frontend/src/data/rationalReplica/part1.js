/**
 * part1.js — 有理数视频复刻 · 第 1–6 章（概念篇）
 *
 * 数据契约（由 index.js 的 compileChapter 消费）：
 *   每章 { id, no, title, steps: [...] }
 *   每步 { say: 旁白原文, add?: 元素[], drop?: 元素 id[] }
 *   - add：插入或更新元素（同 id 即更新， Map 保持原顺序）
 *   - drop：移除元素（播退场动画）
 *   - scene 由 index.js 累积生成，元素 id 章内唯一
 */
import { K } from './palette.js'

export default [
  /* ============ 第 1 个视频：正数和负数 ============ */
  {
    id: 'rr-ch01',
    no: 1,
    title: '正数和负数',
    steps: [
      {
        say: '这个视频我要来讲讲什么是正数和负数。温度计你肯定见过，它以零度为分界点。',
        add: [
          { id: 'th', type: 'thermo', x: 150, y: 120, s: 1 },
          { id: 'cap', type: 'text', x: 330, y: 170, t: '温度计', s: 26, b: true, font: 'brush' },
        ],
      },
      {
        say: '有的温度比零大，像十度、二十度、三十度等等。',
        add: [{ id: 'th', type: 'thermo', x: 150, y: 120, s: 1, hi: [10, 20, 30] }],
      },
      {
        say: '有的温度比零小，像零下十度、零下二十度、零下三十度等等。',
        add: [{ id: 'th', type: 'thermo', x: 150, y: 120, s: 1, hi: [-10, -20, -30] }],
      },
      {
        say: '这些比零大的数就是所谓的正数，而比零小的数就是所谓的负数。',
        add: [
          { id: 'th', type: 'thermo', x: 150, y: 120, s: 1 },
          { id: 'pos-lab', type: 'text', x: 340, y: 190, t: '比零大 → 正数', s: 24, b: true, c: K.red },
          { id: 'neg-lab', type: 'text', x: 340, y: 320, t: '比零小 → 负数', s: 24, b: true, c: K.blue },
        ],
      },
      {
        say: '所以正和负其实就是比零大和比零小的意思。',
      },
      {
        say: '不难发现，负数前面都有一个写得跟减号一样的符号，这个符号就叫做负号，你在念的时候直接念负就行。',
        add: [
          { id: 'sign-t', type: 'text', x: 340, y: 240, t: '负号（念作「负」）', s: 18, c: K.blue },
          {
            id: 'neg-eq',
            type: 'eqline',
            x: 340,
            y: 285,
            s: 26,
            parts: [
              { t: '-', c: K.blue, b: true },
              { t: '10' },
              { t: '     ' },
              { t: '-', c: K.blue, b: true },
              { t: '20' },
              { t: '     ' },
              { t: '-', c: K.blue, b: true },
              { t: '30' },
            ],
          },
        ],
      },
      {
        say: '比如这个数就念负十，这个数就念负二十，这个数就念负三十。',
      },
      {
        say: '负数都有自己的符号负号了，那正数有没有自己的符号正号呢？答案是肯定的，这就是正号，它长得跟加号一样，只不过你得念正，不能念加。',
        drop: ['neg-eq'],
        add: [
          { id: 'sign-t', type: 'text', x: 340, y: 240, t: '正号（念作「正」，不念加）', s: 18, c: K.red },
          {
            id: 'pos-eq',
            type: 'eqline',
            x: 340,
            y: 285,
            s: 26,
            parts: [
              { t: '+', c: K.red, b: true },
              { t: '10' },
              { t: '     ' },
              { t: '+', c: K.red, b: true },
              { t: '20' },
              { t: '     ' },
              { t: '+', c: K.red, b: true },
              { t: '30' },
            ],
          },
        ],
      },
      {
        say: '比如这就念正十，这就念正二十，这就念正三十。在实际应用中，正号一般都省略不写，此时你直接念十、二十、三十就行。',
        drop: ['pos-eq'],
        add: [
          { id: 'sign-t', type: 'text', x: 340, y: 240, t: '正号一般省略不写', s: 18, c: K.sub },
          {
            id: 'plain-eq',
            type: 'eqline',
            x: 340,
            y: 285,
            s: 26,
            parts: [{ t: '10' }, { t: '     ' }, { t: '20' }, { t: '     ' }, { t: '30' }],
          },
        ],
      },
      {
        say: '回忆一下，你小学学过的数是不是都是正数？确实，像一、二、三、四、三点八、四点五、零点八八循环、二分之派等等，都是正数。',
        drop: ['plain-eq', 'sign-t'],
        add: [
          { id: 'elem-lab', type: 'text', x: 340, y: 235, t: '小学学过的数（几乎都是正数）', s: 18, c: K.sub },
          {
            id: 'elem-eq',
            type: 'eqline',
            x: 340,
            y: 285,
            s: 24,
            parts: [
              { t: '1' }, { t: '   ' }, { t: '2' }, { t: '   ' }, { t: '3' }, { t: '   ' }, { t: '4' },
              { t: '   ' }, { t: '3.8' }, { t: '   ' }, { t: '4.5' }, { t: '   ' }, { t: '0.88…' },
            ],
          },
          { id: 'pi', type: 'frac', x: 760, y: 290, num: 'π', den: '2', s: 22 },
        ],
      },
      {
        say: '所以你小学学过的几乎所有数都是正数，不过有一个数不是，它是谁呢？对啦，就是零，因为零是正和负的分界点，所以它本身既不是正，也不是负，它是一个没有符号的数。',
        drop: ['elem-eq', 'pi', 'elem-lab'],
        add: [
          { id: 'th', type: 'thermo', x: 150, y: 120, s: 1, hi: [0] },
          { id: 'zero-note', type: 'text', x: 340, y: 260, t: '0：分界点，非正非负', s: 24, b: true },
          { id: 'zero-note2', type: 'text', x: 340, y: 300, t: '它是一个没有符号的数', s: 18, c: K.sub },
        ],
      },
      {
        say: '正数和负数你明白啥意思了，那它们有啥用呢？答案很简单，它们可以用来表示具有相反意义的量。比如你一口气吃掉一块八斤的肉，体重增加了八斤，那就可以记作正八。',
        drop: ['th', 'pos-lab', 'neg-lab', 'zero-note', 'zero-note2'],
        add: [
          { id: 'meat', type: 'meat', x: 330, y: 400, s: 1.2 },
          { id: 'meat-eq', type: 'eqline', x: 470, y: 410, s: 26, parts: [{ t: '+8 斤', c: K.red, b: true }] },
          { id: 'meat-note', type: 'text', x: 470, y: 370, t: '体重增加', s: 18, c: K.sub },
        ],
      },
      {
        say: '然后你又拉出了一坨五斤的翔，体重减少了五斤，那就可以记作负五。',
        add: [
          { id: 'poop', type: 'poop', x: 660, y: 420, s: 1.2 },
          { id: 'poop-eq', type: 'eqline', x: 730, y: 410, s: 26, parts: [{ t: '-5 斤', c: K.blue, b: true }] },
          { id: 'poop-note', type: 'text', x: 730, y: 370, t: '体重减少', s: 18, c: K.sub },
        ],
      },
      {
        say: '再比如你往左走三米，把它记作负三，那你走的正四米，其实就是指往右走了四米。',
        drop: ['meat', 'meat-eq', 'meat-note', 'poop', 'poop-eq', 'poop-note'],
        add: [
          { id: 'walk-eq1', type: 'eqline', x: 300, y: 300, s: 26, parts: [{ t: '往左 3 米', c: K.blue }, { t: '  →  ' }, { t: '-3', c: K.blue, b: true }] },
          { id: 'walk-eq2', type: 'eqline', x: 300, y: 370, s: 26, parts: [{ t: '往右 4 米', c: K.red }, { t: '  →  ' }, { t: '+4', c: K.red, b: true }] },
          { id: 'walk-note', type: 'text', x: 300, y: 220, t: '相反意义的量：一正一负', s: 22, b: true },
        ],
      },
      {
        say: '当然，你说我就喜欢把往左记作正，把往右记作负，就是那么任性，你能把我怎么地？行，我认。那此时往左走三米就是正三，往右走四米就是负四了。',
        add: [
          { id: 'walk-eq1', type: 'eqline', x: 300, y: 300, s: 26, parts: [{ t: '往左 3 米', c: K.red }, { t: '  →  ' }, { t: '+3', c: K.red, b: true }] },
          { id: 'walk-eq2', type: 'eqline', x: 300, y: 370, s: 26, parts: [{ t: '往右 4 米', c: K.blue }, { t: '  →  ' }, { t: '-4', c: K.blue, b: true }] },
        ],
      },
      {
        say: '总之，你只要牢记一点，具有相反意义的两个量，一个是正，另一个就是负。',
        drop: ['walk-eq1', 'walk-eq2', 'walk-note'],
        add: [
          { id: 'sum-panel', type: 'panel', x: 270, y: 140, w: 460, h: 220, title: '正与负', tc: K.red },
          { id: 'sum-1', type: 'text', x: 300, y: 205, t: '正数：比 0 大的数', s: 22, c: K.red, b: true },
          { id: 'sum-2', type: 'text', x: 300, y: 255, t: '负数：比 0 小的数', s: 22, c: K.blue, b: true },
          { id: 'sum-3', type: 'text', x: 300, y: 305, t: '0：分界点，既不是正数也不是负数', s: 20 },
        ],
      },
      {
        say: '所谓正数就是比零大的数，所谓负数就是比零小的数。在这里需要特别提醒你注意，零是正和负的分界点，所以它既不是正数，也不是负数。怎么样，听明白了吗？如果明白了，就试着动手做点题吧。',
      },
    ],
  },

  /* ============ 第 2 个视频：有理数 ============ */
  {
    id: 'rr-ch02',
    no: 2,
    title: '有理数',
    steps: [
      {
        say: '这个视频我要和你说说啥是有理数，有理数是有道理的数吗？No，你要是这么想可就错大发了。',
        add: [
          { id: 'q1', type: 'text', x: 300, y: 180, t: '有理数 ＝ 有道理的数？', s: 26, b: true },
          { id: 'q1-x', type: 'mark', x: 272, y: 172, kind: 'cross' },
          { id: 'q1-no', type: 'text', x: 640, y: 185, t: 'No！', s: 32, b: true, c: K.red },
        ],
      },
      {
        say: '其实有理数是整数和分数的统称。',
        drop: ['q1', 'q1-x', 'q1-no'],
        add: [
          { id: 'def-p', type: 'panel', x: 290, y: 150, w: 420, h: 130, title: '定义', tc: K.red },
          { id: 'def-t', type: 'text', x: 320, y: 230, t: '有理数 ＝ 整数 ＋ 分数', s: 28, b: true },
        ],
      },
      {
        say: '可是为什么管它们叫有理数呢？别急，且听我慢慢道来。',
      },
      {
        say: '小学的时候你学过整数、分数还有小数，像零和三就是整数，三分之一、五分之六就是分数，而零点七、三点八、零点三三循环还有派，这些都是小数。',
        drop: ['def-p', 'def-t'],
        add: [
          { id: 'g1', type: 'catrow', x: 90, y: 100, w: 820, h: 78, s: 24, c: K.red, label: '整数', parts: [{ t: '0' }, { t: '        ' }, { t: '3' }] },
          { id: 'g2', type: 'catrow', x: 90, y: 198, w: 820, h: 78, s: 24, c: K.blue, label: '分数', parts: [{ frac: { num: '1', den: '3' }, s: 24 }, { t: '        ' }, { frac: { num: '6', den: '5' }, s: 24 }] },
          { id: 'g3', type: 'catrow', x: 90, y: 296, w: 820, h: 78, s: 24, c: K.orange, label: '小数', parts: [{ t: '0.7' }, { t: '     ' }, { t: '3.8' }, { t: '     ' }, { t: '0.33…' }, { t: '     ' }, { t: 'π' }] },
        ],
      },
      {
        say: '这一大堆数长相千差万别，但本质上来讲其实就两类，前面这一大坨是一类，后面的派则属于另一类。',
        drop: ['g1', 'g2', 'g3'],
        add: [
          { id: 'grp-a', type: 'catrow', x: 90, y: 118, w: 820, h: 88, s: 26, c: K.green, label: '同一类', parts: [{ t: '0' }, { t: '    ' }, { t: '3' }, { t: '    ' }, { frac: { num: '1', den: '3' }, s: 24 }, { t: '    ' }, { frac: { num: '6', den: '5' }, s: 24 }, { t: '    ' }, { t: '0.7' }, { t: '    ' }, { t: '3.8' }, { t: '    ' }, { t: '0.33…' }] },
          { id: 'grp-b', type: 'catrow', x: 90, y: 236, w: 820, h: 88, s: 26, c: K.red, label: '另一类', parts: [{ t: 'π' }] },
          { id: 'key', type: 'text', x: 300, y: 390, t: '凭啥？就凭都能写成俩整数之比', s: 22, b: true, box: 'green' },
        ],
      },
      {
        say: '纳尼？前面这一坨居然是一类，凭啥呢？就凭它们都能写成俩整数之比。你看，零和三就可以分别写成零比一和三比一，都是俩整数的比吧？',
        drop: ['grp-a', 'grp-b', 'key'],
        add: [
          { id: 'r1', type: 'catrow', x: 90, y: 100, w: 820, h: 78, s: 26, c: K.red, label: '整数', parts: [{ t: '0 ＝ 0∶1' }, { t: '            ' }, { t: '3 ＝ 3∶1' }] },
        ],
      },
      {
        say: '而三分之一、五分之六就是一比三、六比五，还是俩整数的比。',
        add: [
          { id: 'r2', type: 'catrow', x: 90, y: 198, w: 820, h: 78, s: 26, c: K.blue, label: '分数', parts: [{ frac: { num: '1', den: '3' }, s: 24 }, { t: ' ＝ 1∶3' }, { t: '          ' }, { frac: { num: '6', den: '5' }, s: 24 }, { t: ' ＝ 6∶5' }] },
        ],
      },
      {
        say: '至于有限小数零点七，其实就是十分之七，而三点八就等于十分之三十八，约分一下就是五分之十九，它们还是俩整数的比。',
        add: [
          { id: 'r3', type: 'catrow', x: 90, y: 296, w: 820, h: 78, s: 24, c: K.orange, label: '有限小数', parts: [{ t: '0.7 ＝ 7∶10' }, { t: '          ' }, { t: '3.8 ＝ 38∶10 ＝ 19∶5' }] },
        ],
      },
      {
        say: '最麻烦的是零点三三循环这样的循环小数，它吧其实就是一除以三所得的商，写成分数的形式就是一比三，你看还是俩整数的比。',
        add: [
          { id: 'r4', type: 'catrow', x: 90, y: 394, w: 820, h: 78, s: 24, c: K.green, label: '循环小数', parts: [{ t: '0.33… ＝ 1 ÷ 3 ＝ 1∶3' }] },
        ],
      },
      {
        say: '所以刚才这一大堆数都能写成俩整数的比，因此就是同一类数了。',
        drop: ['r1', 'r2', 'r3', 'r4'],
        add: [
          { id: 'cls', type: 'text', x: 270, y: 230, t: '都能写成俩整数之比 ⇒ 同一类数', s: 28, b: true, box: 'green' },
        ],
      },
      {
        say: '在这里我还得特别提醒你注意，像零点七、三点八这样的有限小数，以及像零点三三循环这样的循环小数，它们都能写成分数，所以对于这些数，你今后都得把它们看作分数。',
        drop: ['cls'],
        add: [
          { id: 'note-p', type: 'panel', x: 270, y: 150, w: 460, h: 170, title: '特别注意', tc: K.orange },
          { id: 'note-1', type: 'text', x: 300, y: 215, t: '有限小数、循环小数', s: 22 },
          { id: 'note-2', type: 'text', x: 300, y: 260, t: '今后一律看作分数！', s: 24, b: true, c: K.green },
        ],
      },
      {
        say: '于是结论就有了，这些都是整数，而这些都是分数，它们都可以写成俩整数的比，所以是同一类数。如果给它们起一个统一的名字，可以叫它们可比数，而这些可比数就是所谓的有理数了。',
        drop: ['note-p', 'note-1', 'note-2'],
        add: [
          { id: 'name-1', type: 'text', x: 320, y: 210, t: '可比数 ＝ 有理数', s: 32, b: true },
          { id: 'name-2', type: 'text', x: 320, y: 270, t: '（整数 ＋ 分数，分数含有限/循环小数）', s: 20, c: K.sub },
        ],
      },
      {
        say: '说到这儿，你肯定有点奇怪了，可比数不是听着挺直白的吗？干嘛非得叫有理数呢？这个嘛，还得归功于明朝的科学家徐光启同学，他把当时西方数学著作中可比的比字翻译成了文言文中的理字，于是可比就成了有理，可比数就成了有理数。',
        drop: ['name-1', 'name-2'],
        add: [
          { id: 'xu', type: 'person', x: 190, y: 470, pose: 'hold', shirt: K.green },
          { id: 'xu-b', type: 'bubble', x: 280, y: 300, t: '徐光启：把「比」译成了「理」', s: 18, w: 300, h: 56 },
          { id: 'xu-t', type: 'text', x: 300, y: 420, t: '可比 → 有理', s: 24, b: true },
        ],
      },
      {
        say: '所谓有理数，就是可以写为俩整数之比的数，也就是所有的整数和分数。这里的分数除了像三分之一、五分之六这样的分数外，还得包含像零点七、三点八这样的有限小数，以及像零点三三循环这样的循环小数。',
        drop: ['xu', 'xu-b', 'xu-t'],
        add: [
          { id: 'def2-p', type: 'panel', x: 250, y: 130, w: 500, h: 240, title: '有理数', tc: K.red },
          { id: 'def2-1', type: 'text', x: 280, y: 195, t: '能写成俩整数之比的数', s: 22 },
          { id: 'def2-2', type: 'text', x: 280, y: 240, t: '＝ 所有的整数和分数', s: 24, b: true },
          { id: 'def2-3', type: 'text', x: 280, y: 285, t: '分数含：普通分数、有限小数、循环小数', s: 19, c: K.sub },
          { id: 'def2-4', type: 'text', x: 280, y: 325, t: '负数也是有理数（千万别忘）', s: 19, c: K.blue },
        ],
      },
      {
        say: '说到这儿，有一个小伙伴就比较囧了，它就是派，因为派是一个无限不循环小数，而无限不循环小数绝对不可能写成俩整数之比，所以派就不是有理数了。',
        drop: ['def2-p', 'def2-1', 'def2-2', 'def2-3', 'def2-4'],
        add: [
          { id: 'pi-1', type: 'text', x: 300, y: 200, t: 'π 是无限不循环小数', s: 26 },
          { id: 'pi-x', type: 'mark', x: 272, y: 192, kind: 'cross' },
          { id: 'pi-2', type: 'text', x: 300, y: 255, t: '⇒ 不是有理数', s: 26, b: true, c: K.red },
          { id: 'pi-p', type: 'person', x: 260, y: 470, pose: 'stand', mood: 'sad' },
        ],
      },
      {
        say: '不过要想证明这一点，你还得等到高中才行，我就先不啰嗦了。',
      },
      {
        say: '有理数我算是讲差不多了，不过好像还漏了啥？哦对了，我刚才举的例子居然把负数都给忘了，负整数、负分数显然也可以写成俩整数之比啊，你像负一就是负一比一，你像负二就是负二比一，而负五分之六就是负六比五，负零点七就是负十分之七，也就是负七比十。',
        drop: ['pi-1', 'pi-x', 'pi-2', 'pi-p'],
        add: [
          { id: 'n1', type: 'eqline', x: 180, y: 170, s: 24, parts: [{ t: '-1 ＝ -1∶1' }, { t: '        ' }, { t: '-2 ＝ -2∶1' }] },
          { id: 'n2-f', type: 'frac', x: 180, y: 265, num: '6', den: '5', sign: '-', s: 24 },
          { id: 'n2-t', type: 'text', x: 250, y: 253, t: '＝ -6∶5', s: 24 },
          { id: 'n3', type: 'text', x: 450, y: 253, t: '-0.7 ＝ -7∶10', s: 24 },
        ],
      },
      {
        say: '所以像负整数、负分数同样可以写为俩整数之比，所以它们也是有理数。你在理解有理数这个概念时，可千万别忘了负数啊。',
        drop: ['n1', 'n2-f', 'n2-t', 'n3'],
        add: [
          { id: 'neg-yes', type: 'text', x: 260, y: 220, t: '负整数、负分数也是有理数！', s: 28, b: true, box: 'green' },
        ],
      },
      {
        say: '好了，有理数的基本概念就讲到这儿。注意三点：有限小数、循环小数都能写成分数，今后一律看作分数；无限不循环小数（如 π）不是有理数；千万别忘了负数。如果明白的话，就赶快动手刷题去吧。',
        drop: ['neg-yes'],
        add: [
          { id: 'sum-p', type: 'panel', x: 240, y: 120, w: 520, h: 280, title: '注意三点', tc: K.red },
          { id: 'sum-1', type: 'text', x: 270, y: 185, t: '① 有限小数、循环小数 → 看作分数 → 是有理数', s: 20 },
          { id: 'sum-2', type: 'text', x: 270, y: 235, t: '② 无限不循环小数（如 π）→ 不是有理数', s: 20 },
          { id: 'sum-3', type: 'text', x: 270, y: 285, t: '③ 别忘了负数：负整数、负分数也是有理数', s: 20 },
          { id: 'sum-4', type: 'text', x: 270, y: 340, t: '有理数 ＝ 能写成俩整数之比的数', s: 19, c: K.sub },
        ],
      },
    ],
  },

  /* ============ 第 3 个视频：有理数的分类 ============ */
  {
    id: 'rr-ch03',
    no: 3,
    title: '有理数的分类',
    steps: [
      {
        say: '这个视频中，我要讲讲有理数的分类。根据定义，有理数是整数和分数的统称，所以你首先可以把有理数按照整数和分数进行分类。',
        add: [
          { id: 'p', type: 'panel', x: 300, y: 160, w: 400, h: 130, title: '第一种分法', tc: K.red },
          { id: 'p-t', type: 'text', x: 330, y: 240, t: '按 整数 / 分数 分类', s: 26, b: true },
        ],
      },
      {
        say: '比如这些有理数，其中负五分之一百零一是分数，二百五是整数，五分之一是分数，负二零一五是整数，零还是整数，而一点五则是一个有限小数，它可以化成十分之十五，约分也就是二分之三，所以是分数。',
        drop: ['p', 'p-t'],
        add: [
          { id: 'n1', type: 'frac', x: 110, y: 240, num: '1', den: '101', sign: '-', s: 20 },
          { id: 'n2', type: 'text', x: 205, y: 230, t: '250', s: 24 },
          { id: 'n3', type: 'frac', x: 285, y: 240, num: '1', den: '5', s: 22 },
          { id: 'n4', type: 'text', x: 375, y: 230, t: '-2015', s: 24 },
          { id: 'n5', type: 'text', x: 490, y: 230, t: '0', s: 24 },
          { id: 'n6', type: 'text', x: 545, y: 230, t: '1.5', s: 24 },
          { id: 'n7', type: 'text', x: 625, y: 230, t: '-0.11…', s: 22 },
          { id: 'n8', type: 'frac', x: 745, y: 240, num: '4', den: '2', s: 22 },
          { id: 'row-lab', type: 'text', x: 400, y: 165, t: '这一堆有理数', s: 20, c: K.sub, align: 'middle' },
        ],
      },
      {
        say: '而负零点一一循环这个循环小数就等于负九分之一，所以还是一个分数。那二分之四呢？它长得像分数，可又等于二，难道既是整数又是分数不成？',
        add: [
          { id: 'a7', type: 'text', x: 610, y: 285, t: '＝ -1/9', s: 16, c: K.sub },
          { id: 'a8', type: 'text', x: 735, y: 285, t: '＝ 2', s: 16, c: K.sub },
        ],
      },
      {
        say: '如果你这么想可就挂了，它既然等于二，那就是整数，不能是分数。所以你牢记一点，任何有理数不是整数就是分数，绝对不会既是整数又是分数。',
        drop: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'a7', 'a8', 'row-lab'],
        add: [
          { id: 'rule', type: 'eqline', x: 230, y: 250, s: 26, parts: [{ t: '任何有理数 ＝ 整数 或 分数（不重不漏）' }], box: 'green' },
        ],
      },
      {
        say: '由此可见，整数和分数正好把有理数分为了不重不漏的两大类。那到这儿就分完了吗？还能不能再往下继续细分呢？当然可以了，你可以按照符号的正负继续细分，比如整数就能分为正整数和负整数，像二百五、二分之四就是正整数，而负二零一五则是负整数。',
        drop: ['rule'],
        add: [
          {
            id: 'tree1',
            type: 'tree',
            s: 1,
            bg: { x: 90, y: 50, w: 820, h: 462, title: '第一种分法：先按 整数 / 分数，再按 符号', tc: K.red },
            root: '有理数',
            branches: [
              {
                label: '整数',
                c: K.ink,
                children: [
                  { label: '正整数', c: K.red },
                  { label: '负整数', c: K.blue },
                  { label: '零', c: K.sub },
                ],
              },
              {
                label: '分数',
                c: K.ink,
                children: [
                  { label: '正分数', c: K.red },
                  { label: '负分数', c: K.blue },
                ],
              },
            ],
          },
          { id: 'note1', type: 'text', x: 500, y: 536, t: '先按 整数 / 分数 分成两大类，再按符号继续细分', s: 17, c: K.sub, align: 'middle' },
        ],
      },
      {
        say: '像二百五、二分之四就是正整数，而负二零一五则是负整数。哎呀，我二了，还有一个非正非负的家伙零，咱得把它填上。所以整数按照符号必须分为三类，正整数、负整数以及非正非负的零。',
        add: [
          {
            id: 'tree1',
            type: 'tree',
            s: 1,
            bg: { x: 90, y: 50, w: 820, h: 462, title: '第一种分法：先按 整数 / 分数，再按 符号', tc: K.red },
            root: '有理数',
            branches: [
              {
                label: '整数',
                c: K.ink,
                children: [
                  { label: '正整数', c: K.red, nums: ['250', '4/2'] },
                  { label: '负整数', c: K.blue, nums: ['-2015'] },
                  { label: '零', c: K.sub, nums: ['0'] },
                ],
              },
              {
                label: '分数',
                c: K.ink,
                children: [
                  { label: '正分数', c: K.red },
                  { label: '负分数', c: K.blue },
                ],
              },
            ],
          },
          { id: 'note1', type: 'text', x: 500, y: 536, t: '整数按符号分三类：正整数、负整数、零', s: 17, c: K.sub, align: 'middle' },
        ],
      },
      {
        say: '整数按照符号分类完毕了，接着就该轮到分数了。分数也可以分为正分数和负分数，像五分之一、一点五就是正分数，而负五分之一百零幺、负零点一一循环就是负分数。所以分数按照符号只能分为两类，正和负，因为分数没有零，所以不会像整数那样分为三类。',
        add: [
          {
            id: 'tree1',
            type: 'tree',
            s: 1,
            bg: { x: 90, y: 50, w: 820, h: 462, title: '第一种分法：先按 整数 / 分数，再按 符号', tc: K.red },
            root: '有理数',
            branches: [
              {
                label: '整数',
                c: K.ink,
                children: [
                  { label: '正整数', c: K.red, nums: ['250', '4/2'] },
                  { label: '负整数', c: K.blue, nums: ['-2015'] },
                  { label: '零', c: K.sub, nums: ['0'] },
                ],
              },
              {
                label: '分数',
                c: K.ink,
                children: [
                  { label: '正分数', c: K.red, nums: ['1/5', '1.5'] },
                  { label: '负分数', c: K.blue, nums: ['-1/101', '-1/9'] },
                ],
              },
            ],
          },
          { id: 'note1', type: 'text', x: 500, y: 536, t: '分数按符号分两类：正分数、负分数（分数没有零）', s: 17, c: K.sub, align: 'middle' },
        ],
      },
      {
        say: '刚才的分类思路是把有理数先按照整数、分数来分，再按照符号来分。那能不能反过来，先按符号来分，再按整数、分数来分呢？答案是肯定的，还是这一堆数，先根据符号把它们分为正数和负数。',
        drop: ['tree1', 'note1'],
        add: [
          {
            id: 'tree2',
            type: 'tree',
            s: 0.86,
            bg: { x: 90, y: 50, w: 820, h: 462, title: '第二种分法：先按 符号，再按 整数 / 分数', tc: K.blue },
            root: '有理数',
            branches: [
              { label: '正数', c: K.red, children: [{ label: '正整数', c: K.red }, { label: '正分数', c: K.red }] },
              { label: '负数', c: K.blue, children: [{ label: '负整数', c: K.blue }, { label: '负分数', c: K.blue }] },
              { label: '零', c: K.sub, children: [{ label: '0', c: K.sub }] },
            ],
          },
          { id: 'note2', type: 'text', x: 500, y: 536, t: '先按符号分成 正数 / 负数 / 零，再按 整数 / 分数 细分', s: 17, c: K.sub, align: 'middle' },
        ],
      },
      {
        say: '正数包括二百五、二分之四、五分之一、一点五，负数包括负二零一五、负五分之一百零幺以及负零点一一循环。',
        add: [
          {
            id: 'tree2',
            type: 'tree',
            s: 0.86,
            bg: { x: 90, y: 50, w: 820, h: 462, title: '第二种分法：先按 符号，再按 整数 / 分数', tc: K.blue },
            root: '有理数',
            branches: [
              {
                label: '正数',
                c: K.red,
                children: [
                  { label: '正整数', c: K.red, nums: ['250', '4/2'] },
                  { label: '正分数', c: K.red, nums: ['1/5', '1.5'] },
                ],
              },
              {
                label: '负数',
                c: K.blue,
                children: [
                  { label: '负整数', c: K.blue, nums: ['-2015'] },
                  { label: '负分数', c: K.blue, nums: ['-1/101', '-1/9'] },
                ],
              },
              { label: '零', c: K.sub, children: [{ label: '0', c: K.sub }] },
            ],
          },
        ],
      },
      {
        say: '哎呀，我居然又把零给漏掉了，零既非正也非负，所以必须独立于正负之外自成一类。以后凡是遇到按符号进行分类的情形，一定不要忘了考虑零这个非正非负的家伙呀。',
        add: [
          { id: 'note2', type: 'text', x: 500, y: 536, t: '注意：按符号分类，一定别忘了零！', s: 19, b: true, c: K.red, align: 'middle' },
        ],
      },
      {
        say: '有理数按符号分完了，接着该轮到按整数和分数进行分类了。其中正数中的二百五和二分之四是正整数，而五分之一和一点五是正分数。负数中的负二零一五是负整数，而负五分之一百零幺和负零点一一循环则是负分数。',
      },
      {
        say: '比较一下前后这两种分类方式，你就会发觉，不管分类的顺序如何，最后都是五类数，正整数、正分数、负整数、负分数，然后就是非正非负的家伙零。',
        drop: ['tree2', 'note2'],
        add: [
          { id: 'five-t', type: 'text', x: 500, y: 150, t: '不管怎么分，都是这五类', s: 26, b: true, align: 'middle' },
          { id: 'c1', type: 'text', x: 260, y: 220, t: '正整数', s: 22, c: K.red, b: true, box: 'red' },
          { id: 'c2', type: 'text', x: 440, y: 220, t: '正分数', s: 22, c: K.red, b: true, box: 'red' },
          { id: 'c3', type: 'text', x: 620, y: 220, t: '负整数', s: 22, c: K.blue, b: true },
          { id: 'c4', type: 'text', x: 800, y: 220, t: '负分数', s: 22, c: K.blue, b: true },
          { id: 'c5', type: 'text', x: 470, y: 320, t: '0', s: 22, c: K.gray, b: true },
        ],
      },
      {
        say: '有了上述这两种分类方式，你就可以从容地处理一些看上去有点绕的分类问题。比如我问你，一个有理数既不是整数也不是正数，那它是什么数呢？遇到这种题先别在脑子里瞎想，看看刚才的分类先。',
        drop: ['five-t'],
        add: [
          { id: 'qq', type: 'text', x: 500, y: 150, t: '一个有理数：既不是整数，也不是正数 ⇒ 它是？', s: 22, b: true, align: 'middle' },
        ],
      },
      {
        say: '既然不是整数，那就干掉整数，留下分数，而且也不是正数，那就继续把正分数干掉，剩下的自然就是负分数了。你看，有了这张分类表，你一下子就能搞定。',
        add: [
          { id: 'x1', type: 'mark', x: 296, y: 213, kind: 'cross' },
          { id: 'x2', type: 'mark', x: 476, y: 213, kind: 'cross' },
          { id: 'x3', type: 'mark', x: 656, y: 213, kind: 'cross' },
          { id: 'x5', type: 'mark', x: 478, y: 313, kind: 'cross' },
          { id: 'ok4', type: 'ring', x: 848, y: 213, rx: 56, ry: 25, c: K.green },
          { id: 'ans', type: 'text', x: 500, y: 400, t: '答案：负分数', s: 26, b: true, c: K.green, align: 'middle' },
        ],
      },
      {
        say: '在这里，我还要介绍一个新的概念，非负数。注意这个词的念法，不是非负数，而是非负数，意思就是非负的数。那非负是啥意思呢？意思就是不是负的。',
        drop: ['c1', 'c2', 'c3', 'c4', 'c5', 'x1', 'x2', 'x3', 'x5', 'ok4', 'ans', 'qq'],
        add: [
          { id: 'nn-1', type: 'text', x: 330, y: 200, t: '非负数', s: 34, b: true },
          { id: 'nn-2', type: 'text', x: 330, y: 255, t: '念作：非 · 负数（不是负的数）', s: 20, c: K.sub },
        ],
      },
      {
        say: '根据刚才的分类，不是负的就是正的或者零，正表示大于零，而零就等于零，所以非负其实就是大于或等于零的意思。以后你一看到非负俩字，就把它翻译成大于等于零。比如非负数就是大于等于零的数，而非负整数就是大于等于零的整数。',
        add: [
          { id: 'nn-3', type: 'eqline', x: 280, y: 330, s: 26, parts: [{ t: '非负 ⟺ 大于或等于零（≥ 0）' }], box: 'green' },
          { id: 'nn-4', type: 'text', x: 280, y: 390, t: '非负数 ＝ ≥0 的数；非负整数 ＝ ≥0 的整数', s: 20 },
        ],
      },
      {
        say: '有理数的分类就讲到这儿为止，最主要的是要教你如何从整数、分数这个角度，以及从数的符号这个角度对有理数进行分类。其中有三点得提醒你注意。首先，在按照整数、分数进行分类时，整数就是整数，分数就是分数，两者不会有重叠。其次，在按照符号分类时，一定不能只考虑正负，还得把非正非负的零单独分为一类。最后，一定要准确理解非负的含义，一看到非负俩字儿，就把它翻译为大于等于零。怎么样，明白了吗？如果明白的话，就自个儿动手刷题去吧。',
        drop: ['nn-1', 'nn-2', 'nn-3', 'nn-4'],
        add: [
          { id: 'sum-p', type: 'panel', x: 230, y: 120, w: 540, h: 280, title: '分类 · 三点', tc: K.red },
          { id: 'sum-1', type: 'text', x: 260, y: 185, t: '① 按整数/分数：整数是整数，分数是分数，不重叠', s: 19 },
          { id: 'sum-2', type: 'text', x: 260, y: 235, t: '② 按符号分类：正、负之外，零必须单独一类', s: 19 },
          { id: 'sum-3', type: 'text', x: 260, y: 285, t: '③ 看到「非负」，就翻译成 ≥ 0', s: 19 },
          { id: 'sum-4', type: 'text', x: 260, y: 340, t: '两种顺序，最终都是五类：正整数、正分数、负整数、负分数、0', s: 17, c: K.sub },
        ],
      },
    ],
  },

  /* ============ 第 4 个视频：数轴 ============ */
  {
    id: 'rr-ch04',
    no: 4,
    title: '数轴',
    steps: [
      {
        say: '在讲正数和负数的时候用过温度计，温度计上有零、十、二十、三十，还有负十、负二十、负三十等，这就是一根带有整数的轴。那能不能把数都扔到一根轴上去呢？不妨试试。',
        add: [
          { id: 'th', type: 'thermo', x: 130, y: 110, s: 0.85 },
          { id: 'th-t', type: 'text', x: 330, y: 220, t: '把温度计拉直 →', s: 24, b: true },
          { id: 'th-a', type: 'arrow', x: 330, y: 250, x2: 440, y2: 300, c: K.orange },
        ],
      },
      {
        say: '首先要找个地方放零，然后找个地方放一，一在零的右边。',
        drop: ['th', 'th-t', 'th-a'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            pts: [{ v: 0, lab: '0', c: K.ink }],
          },
        ],
      },
      {
        say: '接着再放二，二比一多一个，那就再往右一格，然后三、四、五，这些正整数依次就放好了。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            pts: [
              { v: 0, lab: '0', c: K.ink },
              { v: 1, lab: '1', c: K.red },
              { v: 2, lab: '2', c: K.red },
              { v: 3, lab: '3', c: K.red },
              { v: 4, lab: '4', c: K.red },
              { v: 5, lab: '5', c: K.red },
            ],
          },
        ],
      },
      {
        say: '放好了正整数，对称过去就是负整数了。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            pts: [
              { v: 5, lab: '5', c: K.red },
              { v: 4, lab: '4', c: K.red },
              { v: 3, lab: '3', c: K.red },
              { v: 2, lab: '2', c: K.red },
              { v: 1, lab: '1', c: K.red },
              { v: 0, lab: '0', c: K.ink },
              { v: -1, lab: '-1', c: K.blue },
              { v: -2, lab: '-2', c: K.blue },
              { v: -3, lab: '-3', c: K.blue },
              { v: -4, lab: '-4', c: K.blue },
              { v: -5, lab: '-5', c: K.blue },
            ],
          },
          { id: 'sym', type: 'text', x: 420, y: 170, t: '关于原点对称', s: 20, c: K.sub, align: 'middle' },
        ],
      },
      {
        say: '整数都就位了，来排分数。比如要找到五分之三的位置，可以先把一分成五份，那每一份就是五分之一，三份就是五分之三了。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            fracTicks: [
              { v: 0.2 },
              { v: 0.4 },
              { v: 0.6, c: K.green },
              { v: 0.8 },
            ],
            arcs: [{ kind: 'bracket', a: 0, b: 1, dy: 72, lab: '0～1 分成 5 等份', c: K.orange }],
            pts: [
              { v: 5, lab: '5', c: K.red },
              { v: 4, lab: '4', c: K.red },
              { v: 3, lab: '3', c: K.red },
              { v: 2, lab: '2', c: K.red },
              { v: 1, lab: '1', c: K.red },
              { v: 0, lab: '0', c: K.ink },
              { v: -1, lab: '-1', c: K.blue },
              { v: -2, lab: '-2', c: K.blue },
              { v: -3, lab: '-3', c: K.blue },
              { v: -4, lab: '-4', c: K.blue },
              { v: -5, lab: '-5', c: K.blue },
              { v: 0.6, lab: '3/5', c: K.green, labSize: 15 },
            ],
          },
        ],
      },
      {
        say: '关于原点对称，就可以得到负五分之三。',
        drop: ['sym'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            fracTicks: [
              { v: 0.2 },
              { v: 0.4 },
              { v: 0.6, c: K.green },
              { v: 0.8 },
              { v: -0.6, c: K.green },
            ],
            arcs: [
              { kind: 'bracket', a: 0, b: 1, dy: 72, lab: '0～1 分成 5 等份', c: K.orange },
              { kind: 'fold', a: -0.6, b: 0.6, lab: '关于原点对称', c: K.orange },
            ],
            pts: [
              { v: 5, lab: '5', c: K.red },
              { v: 4, lab: '4', c: K.red },
              { v: 3, lab: '3', c: K.red },
              { v: 2, lab: '2', c: K.red },
              { v: 1, lab: '1', c: K.red },
              { v: 0, lab: '0', c: K.ink },
              { v: -1, lab: '-1', c: K.blue },
              { v: -2, lab: '-2', c: K.blue },
              { v: -3, lab: '-3', c: K.blue },
              { v: -4, lab: '-4', c: K.blue },
              { v: -5, lab: '-5', c: K.blue },
              { v: 0.6, lab: '3/5', c: K.green, labSize: 15 },
              { v: -0.6, lab: '-3/5', c: K.green, labSize: 15 },
            ],
          },
        ],
      },
      {
        say: '这样分数也能找到自己的位置了。你发现只要确定好零和一的位置，所有数的位置都能搞定。零所在的位置叫原点，从零往一的方向叫正方向，一般向右为正方向，越往右数越大。零和一之间的距离叫单位长度。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            fracTicks: [
              { v: 0.2 },
              { v: 0.4 },
              { v: 0.6, c: K.green },
              { v: 0.8 },
              { v: -0.6, c: K.green },
            ],
            arcs: [
              { kind: 'bracket', a: 0, b: 1, dy: 72, lab: '单位长度', c: K.red },
              { kind: 'bracket', a: -1, b: 0, dy: 72, c: K.red },
            ],
            originRing: true,
            pts: [
              { v: 5, lab: '5', c: K.red },
              { v: 4, lab: '4', c: K.red },
              { v: 3, lab: '3', c: K.red },
              { v: 2, lab: '2', c: K.red },
              { v: 1, lab: '1', c: K.red },
              { v: 0, lab: '0', c: K.ink },
              { v: -1, lab: '-1', c: K.blue },
              { v: -2, lab: '-2', c: K.blue },
              { v: -3, lab: '-3', c: K.blue },
              { v: -4, lab: '-4', c: K.blue },
              { v: -5, lab: '-5', c: K.blue },
              { v: 0.6, lab: '3/5', c: K.green, labSize: 15 },
              { v: -0.6, lab: '-3/5', c: K.green, labSize: 15 },
            ],
          },
          { id: 'o-lab', type: 'text', x: 500, y: 300, t: '原点', s: 16, c: K.ink, align: 'middle', b: true },
          { id: 'd-lab', type: 'text', x: 700, y: 300, t: '正方向 →', s: 16, c: K.red },
        ],
      },
      {
        say: '具备了原点、正方向和单位长度的直线就叫数轴。也就是说数轴包含原点、正方向、单位长度这个三要素。',
        add: [
          { id: 'tri-p', type: 'panel', x: 620, y: 100, w: 310, h: 180, title: '数轴三要素', tc: K.red },
          { id: 'tri-1', type: 'text', x: 650, y: 160, t: '① 原点', s: 20 },
          { id: 'tri-2', type: 'text', x: 650, y: 205, t: '② 正方向（一般向右）', s: 20 },
          { id: 'tri-3', type: 'text', x: 650, y: 250, t: '③ 单位长度', s: 20 },
        ],
      },
      {
        say: '有了数轴，咱就可以给每个数找个位置，比如表示三的点就在原点右边，距离原点三个单位长度，表示负五的点就在原点左侧，距离原点五个单位长度。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            fracTicks: [
              { v: 0.2 },
              { v: 0.4 },
              { v: 0.6, c: K.green },
              { v: 0.8 },
              { v: -0.6, c: K.green },
            ],
            arcs: [
              { kind: 'walk', a: 0, b: 3, lab: '向右 3 个单位长度', c: K.red },
              { kind: 'walk', a: -5, b: 0, lab: '向左 5 个单位长度', c: K.blue },
            ],
            originRing: true,
            pts: [
              { v: 5, lab: '5', c: K.red },
              { v: 4, lab: '4', c: K.red },
              { v: 3, lab: '3', c: K.red, ring: true },
              { v: 2, lab: '2', c: K.red },
              { v: 1, lab: '1', c: K.red },
              { v: 0, lab: '0', c: K.ink },
              { v: -1, lab: '-1', c: K.blue },
              { v: -2, lab: '-2', c: K.blue },
              { v: -3, lab: '-3', c: K.blue },
              { v: -4, lab: '-4', c: K.blue },
              { v: -5, lab: '-5', c: K.blue, ring: true },
              { v: 0.6, lab: '3/5', c: K.green, labSize: 15 },
              { v: -0.6, lab: '-3/5', c: K.green, labSize: 15 },
            ],
          },
        ],
      },
      {
        say: '那么问题来了，数轴上点的移动又该咋办呢？一个点从原点出发，先向右移动三个单位长度，再向左移动五个单位长度到达 A 点，求 A 点所表示的数。',
        drop: ['o-lab', 'd-lab'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            arcs: [{ kind: 'walk', a: 0, b: 3, lab: '向右 3 格', c: K.red }],
            move: { from: 0, to: 3, ms: 1400, lab: 'A', c: K.red },
            originRing: true,
            pts: [{ v: 0, lab: '0', c: K.ink }],
          },
          { id: 'q-eq', type: 'eqline', x: 250, y: 150, s: 26, parts: [{ t: '0 ＋ 3 － 5 ＝ ?' }], box: 'red' },
        ],
      },
      {
        say: '结合图像来思考这个问题就非常简单。一个点从原点向右走，一、二、三，三个单位长度就会到三的位置，再向左走，一、二、三、四、五，五个单位长度就会到负二的位置，这也就是答案。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            arcs: [{ kind: 'walk', a: 3, b: -2, lab: '向左 5 格', c: K.blue }],
            move: { from: 3, to: -2, ms: 1600, lab: 'A', c: K.red },
            originRing: true,
            pts: [
              { v: 0, lab: '0', c: K.ink },
              { v: -2, lab: 'A', c: K.red, ring: true },
            ],
          },
          { id: 'q-eq', type: 'eqline', x: 250, y: 150, s: 26, parts: [{ t: '0 ＋ 3 － 5 ＝ -2' }], box: 'green' },
        ],
      },
      {
        say: '怎么样，简单吧？那么问题又来了，到负一的距离为两个单位长度的点是几呢？还是先画个数轴，找到负一，但是该往左走还是往右走呢？它没说，所以两种都有可能。',
        drop: ['q-eq'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            arcs: [
              { kind: 'walk', a: -1, b: 1, lab: '向右 2 格', c: K.red },
              { kind: 'walk', a: -1, b: -3, lab: '向左 2 格', c: K.blue },
            ],
            originRing: true,
            pts: [{ v: -1, lab: '-1', c: K.blue, ring: true }],
          },
          { id: 'two', type: 'text', x: 430, y: 150, t: '两种都可能！', s: 26, b: true, c: K.red, align: 'middle' },
        ],
      },
      {
        say: '先看向右的，一个点从负一向右走，一、二，两个单位长度就会到一的位置，所以一 OK。再看向左的，一个点从负一向左走，一、二，两个单位长度就会到负三的位置，所以负三也 OK。因此这个问题的正确答案就有俩，负三或一，可别丢一个。',
        drop: ['two'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 180,
            y: 340,
            w: 640,
            from: -5,
            to: 5,
            arcs: [
              { kind: 'walk', a: -1, b: 1, lab: '向右 2 格', c: K.red },
              { kind: 'walk', a: -1, b: -3, lab: '向左 2 格', c: K.blue },
            ],
            originRing: true,
            pts: [
              { v: -1, lab: '-1', c: K.blue, ring: true },
              { v: 1, lab: '1', c: K.red },
              { v: -3, lab: '-3', c: K.blue },
            ],
          },
          { id: 'ans-eq', type: 'eqline', x: 380, y: 150, s: 26, parts: [{ t: '答案：-3 或 1' }], box: 'green' },
        ],
      },
      {
        say: '看出来了吧？对于数轴上点的移动问题，只要画出数轴，把数变成点向左右走就可以了。最后来总结一下，对于数轴你要记住这三点。第一，数轴的三要素，原点、正方向和单位长度。第二，数轴上的点均匀分布，原点右边是正数，原点左边是负数。第三，对于点的移动问题，你只要先画出数轴，然后搞清楚点从哪出发，往哪走，以及走多少就行。',
        drop: ['nl', 'ans-eq', 'tri-p', 'tri-1', 'tri-2', 'tri-3'],
        add: [
          { id: 'sum-p', type: 'panel', x: 240, y: 120, w: 520, h: 280, title: '数轴 · 记住三点', tc: K.red },
          { id: 'sum-1', type: 'text', x: 270, y: 185, t: '① 三要素：原点、正方向、单位长度', s: 20 },
          { id: 'sum-2', type: 'text', x: 270, y: 235, t: '② 点均匀分布：原点右边是正数，左边是负数', s: 20 },
          { id: 'sum-3', type: 'text', x: 270, y: 285, t: '③ 点的移动：画数轴，弄清出发点、方向、距离', s: 20 },
          { id: 'sum-4', type: 'text', x: 270, y: 340, t: '越往右，数越大', s: 18, c: K.sub },
        ],
      },
      {
        say: '学了数轴这么霸道好用的知识，还不快去把题目都秒杀了！',
      },
    ],
  },

  /* ============ 第 5 个视频：相反数 ============ */
  {
    id: 'rr-ch05',
    no: 5,
    title: '相反数',
    steps: [
      {
        say: '数轴你已经学过了，不难发现数轴上绝大多数的点都是成双成对的，比如一和负一，二和负二，三和负三等等等等。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 300,
            w: 560,
            from: -5,
            to: 5,
            arcs: [
              { kind: 'fold', a: -1, b: 1, lab: '对折重合', c: K.orange },
              { kind: 'fold', a: -2, b: 2, label: false, c: K.orange },
              { kind: 'fold', a: -3, b: 3, label: false, c: K.orange },
            ],
            originRing: true,
            pts: [
              { v: 1, lab: '1', c: K.red },
              { v: -1, lab: '-1', c: K.blue },
              { v: 2, lab: '2', c: K.red },
              { v: -2, lab: '-2', c: K.blue },
              { v: 3, lab: '3', c: K.red },
              { v: -3, lab: '-3', c: K.blue },
            ],
          },
        ],
      },
      {
        say: '像这种数值相同、符号相反的两个数，就叫互为相反数，简称相反数。',
        add: [
          { id: 'def', type: 'text', x: 300, y: 112, t: '相反数：数值相同、符号相反', s: 26, b: true },
        ],
      },
      {
        say: '直观来讲，两数互为相反数，一定是关于原点对称，所以正数的相反数一定是负数，负数的相反数也一定是正数。比如四的相反数就是负四，而负五的相反数就是五。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 300,
            w: 560,
            from: -5,
            to: 5,
            arcs: [
              { kind: 'fold', a: -1, b: 1, lab: '对折重合', c: K.orange },
              { kind: 'fold', a: -2, b: 2, label: false, c: K.orange },
              { kind: 'fold', a: -3, b: 3, label: false, c: K.orange },
              { kind: 'fold', a: -4, b: 4, label: false, c: K.orange },
              { kind: 'fold', a: -5, b: 5, label: false, c: K.orange },
            ],
            originRing: true,
            pts: [
              { v: 1, lab: '1', c: K.red },
              { v: -1, lab: '-1', c: K.blue },
              { v: 2, lab: '2', c: K.red },
              { v: -2, lab: '-2', c: K.blue },
              { v: 3, lab: '3', c: K.red },
              { v: -3, lab: '-3', c: K.blue },
              { v: 4, lab: '4', c: K.red },
              { v: -4, lab: '-4', c: K.blue },
              { v: 5, lab: '5', c: K.red },
              { v: -5, lab: '-5', c: K.blue },
            ],
          },
        ],
      },
      {
        say: '不过还有一个非正非负的家伙比较特别，那就是零。由于零关于原点的对称点还是它自己，所以零的相反数还是零。',
        add: [
          { id: 'nl', type: 'numberline', x: 220, y: 300, w: 560, from: -5, to: 5, originRing: true, pts: [{ v: 0, lab: '0', c: K.ink }] },
          { id: 'z-note', type: 'text', x: 330, y: 180, t: '0 的相反数还是 0', s: 22, b: true },
        ],
      },
      {
        say: '那么问题来了，如果我给你个字母 a，它的相反数又该咋表示呢？有小伙伴说，a 的相反数不就是负 a 吗？对喽，a 的相反数确实是负 a，这里的负号表示相反的意思，所以负 a 就表示 a 的相反数。',
        drop: ['z-note'],
        add: [
          { id: 'nl', type: 'numberline', x: 220, y: 300, w: 560, from: -5, to: 5, originRing: true, pts: [] },
          { id: 'a-eq', type: 'eqline', x: 300, y: 170, s: 30, parts: [{ t: 'a 的相反数 ＝ -a' }], box: 'red' },
        ],
      },
      {
        say: '而这个 a 可以是任何数，也就是说以后要求相反数，你统一添上负号就行。比如五的相反数就是负五，六的相反数就是负六，而负五的相反数就可以写成负负五。',
        add: [
          { id: 'a-eq', type: 'eqline', x: 260, y: 170, s: 26, parts: [{ t: '5 → -5' }, { t: '      6 → -6' }, { t: '      -5 → -(-5)' }] },
        ],
      },
      {
        say: '等等，难道负五的相反数不是五吗？对喽，所以负负五就是五，这就是传说中的负负得正。',
        add: [
          { id: 'a-eq', type: 'eqline', x: 330, y: 170, s: 30, parts: [{ t: '-(-5) ＝ 5' }], box: 'green' },
          { id: 'nn', type: 'text', x: 620, y: 165, t: '负负得正', s: 24, b: true, c: K.red },
        ],
      },
      {
        say: '不过有人马上就说了，那如果是负正二又该怎么办呢？我之前说过，正号可以省略，所以它就等于负二。',
        add: [
          { id: 'a-eq', type: 'eqline', x: 330, y: 170, s: 30, parts: [{ t: '-(+2) ＝ -2' }] },
          { id: 'nn', type: 'text', x: 620, y: 165, t: '正号可省略', s: 20, c: K.sub },
        ],
      },
      {
        say: '好了，最后来总结一下，所谓相反数就是数值相同、符号相反的俩数。关于这个概念，你得注意这三点。首先，俩数互为相反数，一定会关于原点对称，所以零的相反数还是零。其次，求一个数的相反数，只要在它前面添个负号，像 a 的相反数就是负 a。最后，正号可以省略，而两个负号可以相互抵消，像负负二就是正二。为师这就讲完了，徒儿们速速刷题去吧。',
        drop: ['a-eq', 'nn', 'def', 'nl'],
        add: [
          { id: 'sum-p', type: 'panel', x: 240, y: 120, w: 520, h: 260, title: '相反数 · 三点', tc: K.red },
          { id: 'sum-1', type: 'text', x: 270, y: 185, t: '① 互为相反数 ⇔ 关于原点对称（0 的相反数是 0）', s: 19 },
          { id: 'sum-2', type: 'text', x: 270, y: 235, t: '② 求相反数：前面添个负号，a 的相反数是 -a', s: 19 },
          { id: 'sum-3', type: 'text', x: 270, y: 285, t: '③ 正号可省略；两个负号相互抵消（-(-2)=2）', s: 19 },
          { id: 'sum-4', type: 'text', x: 270, y: 340, t: '相反数 ＝ 数值相同、符号相反', s: 17, c: K.sub },
        ],
      },
    ],
  },

  /* ============ 第 6 个视频：绝对值 ============ */
  {
    id: 'rr-ch06',
    no: 6,
    title: '绝对值',
    steps: [
      {
        say: '这个视频我先给你讲一个汪星人的故事。有一只小汪郁闷了，想要散步，它从原点出发，走三个单位长度，请问有几种走法呢？',
        add: [
          { id: 'nl', type: 'numberline', x: 220, y: 330, w: 560, from: -5, to: 5, originRing: true, pts: [] },
          { id: 'dog', type: 'dog', x: 500, y: 262, s: 1 },
          { id: 'q', type: 'text', x: 250, y: 150, t: '小汪从原点出发，走 3 个单位长度', s: 22 },
          { id: 'qm', type: 'qmark', x: 850, y: 170, s: 46 },
        ],
      },
      {
        say: '肯定是两种了，一种向左走，走到负三。',
        add: [
          { id: 'dogL', type: 'dog', x: 500, y: 262, s: 1, walk: { dx: -168, ms: 1500 } },
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 330,
            w: 560,
            from: -5,
            to: 5,
            arcs: [{ kind: 'walk', a: 0, b: -3, lab: '向左 3', c: K.blue }],
            originRing: true,
            pts: [{ v: -3, lab: '-3', c: K.blue }],
          },
        ],
      },
      {
        say: '一种向右走，走到三。虽然方向不一样，但是这两种走法到原点的距离是一样的，都是三。',
        add: [
          { id: 'dogR', type: 'dog', x: 500, y: 262, s: 1, walk: { dx: 168, ms: 1500 } },
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 330,
            w: 560,
            from: -5,
            to: 5,
            arcs: [
              { kind: 'walk', a: 0, b: -3, lab: '向左 3', c: K.blue },
              { kind: 'walk', a: 0, b: 3, lab: '向右 3', c: K.red },
            ],
            originRing: true,
            pts: [
              { v: -3, lab: '-3', c: K.blue },
              { v: 3, lab: '3', c: K.red },
            ],
          },
        ],
      },
      {
        say: '在这里有几个字很关键，就是到原点的距离，你以后会经常遇到与它相关的问题，所以我专门给这段距离起了个名字，叫绝对值。',
        drop: ['dog', 'dogL', 'dogR', 'q', 'qm'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 330,
            w: 560,
            from: -5,
            to: 5,
            arcs: [
              { kind: 'walk', a: -3, b: 0, lab: '距离 3', c: K.blue },
              { kind: 'walk', a: 0, b: 3, lab: '距离 3', c: K.red },
            ],
            originRing: true,
            pts: [
              { v: -3, lab: '-3', c: K.blue },
              { v: 3, lab: '3', c: K.red },
            ],
          },
          { id: 'abs-t', type: 'text', x: 500, y: 88, t: '绝对值', s: 36, b: true, c: K.red, align: 'middle' },
          { id: 'abs-sub', type: 'text', x: 500, y: 124, t: '一个数到原点的距离', s: 22, c: K.red, align: 'middle', u: true },
          { id: 'abs-eq', type: 'eqline', x: 330, y: 215, s: 24, parts: [{ t: '丨a丨 ＝ a 到原点的距离' }] },
        ],
      },
      {
        say: '也就是说，一个数到原点的距离是这个数的绝对值。比如数轴上表示数 a 的点到原点的距离称为 a 的绝对值，我们用两条竖线夹住 a 来表示。',
        add: [
          { id: 'abs-eq', type: 'eqline', x: 300, y: 215, s: 22, parts: [{ t: '数轴上表示 a 的点 ↔ 原点的距离' }] },
          { id: 'abs-t2', type: 'text', x: 660, y: 220, t: '记作 丨a丨', s: 26, b: true },
        ],
      },
      {
        say: '回到我刚才讲的汪星人的故事中，三到原点的距离是三，所以三的绝对值等于三，负三到原点的距离也是三，所以负三的绝对值也等于三。类似的，五的绝对值是五，负五的绝对值也是五，二点五的绝对值是二点五，负二点五的绝对值也是二点五。',
        drop: ['abs-eq', 'abs-t2'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 330,
            w: 560,
            from: -5,
            to: 5,
            originRing: true,
            pts: [
              { v: 3, lab: '3', c: K.red },
              { v: -3, lab: '-3', c: K.blue },
              { v: 5, lab: '5', c: K.red },
              { v: -5, lab: '-5', c: K.blue },
              { v: 2.5, lab: '2.5', c: K.red, labSize: 15 },
              { v: -2.5, lab: '-2.5', c: K.blue, labSize: 15 },
            ],
          },
          { id: 'e1', type: 'eqline', x: 260, y: 165, s: 24, parts: [{ t: '丨3丨 ＝ 3' }, { t: '        ' }, { t: '丨-3丨 ＝ 3' }] },
          { id: 'e2', type: 'eqline', x: 260, y: 215, s: 24, parts: [{ t: '丨5丨 ＝ 5' }, { t: '        ' }, { t: '丨-5丨 ＝ 5' }] },
          { id: 'e3', type: 'eqline', x: 260, y: 265, s: 24, parts: [{ t: '丨2.5丨 ＝ 2.5' }, { t: '        ' }, { t: '丨-2.5丨 ＝ 2.5' }] },
        ],
      },
      {
        say: '由以上几个例子可以看出，正数的绝对值等于它本身，而负数的绝对值就等于它的相反数。正数和负数都搞定了，那就只剩零了。零的绝对值是多少呢？这个很简单，零到原点的距离是零，所以零的绝对值等于零。',
        drop: ['e1', 'e2', 'e3'],
        add: [
          { id: 'nl', type: 'numberline', x: 220, y: 330, w: 560, from: -5, to: 5, originRing: true, pts: [{ v: 0, lab: '0', c: K.ink }] },
          { id: 'c1', type: 'eqline', x: 250, y: 180, s: 26, parts: [{ t: 'a ＞ 0', c: K.red, b: true }, { t: '  ⇒  丨a丨 ＝ a' }] },
          { id: 'c2', type: 'eqline', x: 250, y: 245, s: 26, parts: [{ t: 'a ＜ 0', c: K.blue, b: true }, { t: '  ⇒  丨a丨 ＝ -a' }] },
          { id: 'c3', type: 'eqline', x: 250, y: 310, s: 26, parts: [{ t: 'a ＝ 0', c: K.ink, b: true }, { t: '  ⇒  丨a丨 ＝ 0' }] },
        ],
      },
      {
        say: '讲到这儿，相信你已经明白绝对值怎么求了。正数的绝对值是它本身，负数的绝对值是它的相反数，零的绝对值还是零。那如果给你一个任意的数 a，它的绝对值又是几呢？你肯定在想，这要分情况吧，看看 a 是正、是负还是零。对喽，就是这个思路。',
        drop: ['c1', 'c2', 'c3'],
        add: [
          { id: 'case-p', type: 'panel', x: 250, y: 158, w: 500, h: 230, title: '任意 a 的绝对值', tc: K.red },
          { id: 'case-1', type: 'text', x: 280, y: 210, t: '先判断符号，再求绝对值', s: 22, b: true },
          { id: 'case-2', type: 'text', x: 280, y: 258, t: '丨a丨 ＝ a（a＞0）／ 0（a＝0）／ -a（a＜0）', s: 20 },
          { id: 'case-3', type: 'text', x: 280, y: 312, t: '这里的 - 表示「相反」的意思', s: 18, c: K.sub },
        ],
      },
      {
        say: '如果 a 大于零，那么 a 的绝对值就是它本身，也就是 a。如果 a 等于零，那么 a 的绝对值就是零。如果 a 小于零，那么 a 的绝对值就是它的相反数，也就是负 a。这儿的符号表示相反的意思。OK，你记住一定要先判断符号，再求绝对值。',
        add: [
          { id: 'case-2', type: 'text', x: 280, y: 258, t: '丨a丨 ＝ a（a＞0）' , s: 20 },
          { id: 'case-2b', type: 'text', x: 280, y: 293, t: '丨a丨 ＝ 0（a＝0）', s: 20 },
          { id: 'case-2c', type: 'text', x: 280, y: 328, t: '丨a丨 ＝ -a（a＜0）', s: 20 },
          { id: 'case-3', type: 'text', x: 280, y: 360, t: '这里的 - 表示「相反」的意思', s: 18, c: K.sub },
        ],
      },
      {
        say: '那么问题来了，如果 a 的绝对值是三，a 是多少呢？咱先画个数轴看一下，a 的绝对值是三，表示 a 与原点距离三个单位长度，三和负三都满足要求，所以 a 就有俩答案，三或负三。你也可以写成 a 等于正负三。',
        drop: ['case-p', 'case-1', 'case-2', 'case-2b', 'case-2c', 'case-3'],
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 330,
            w: 560,
            from: -5,
            to: 5,
            arcs: [
              { kind: 'walk', a: 0, b: 3, lab: '距离 3', c: K.red },
              { kind: 'walk', a: -3, b: 0, lab: '距离 3', c: K.blue },
            ],
            originRing: true,
            pts: [
              { v: 3, lab: '3', c: K.red, ring: true },
              { v: -3, lab: '-3', c: K.blue, ring: true },
            ],
          },
          { id: 'pa-eq', type: 'eqline', x: 380, y: 205, s: 26, parts: [{ t: '丨a丨 ＝ 3  ⇒  a ＝ ±3' }], box: 'green' },
        ],
      },
      {
        say: '那么问题又来了，如果 a 的绝对值就是 a 本身，a 又是多少呢？你看，当 a 大于零时，a 的绝对值等于 a，符合要求。这就够了吗？别忘了，当 a 等于零时，a 的绝对值等于零，也等于 a，所以零也可以。那就是说，当 a 大于或等于零时，a 的绝对值都等于它本身。还记得大于等于零的数统称为什么吗？非负数。所以只有当 a 是非负数时，a 的绝对值才能等于它本身。',
        add: [
          {
            id: 'nl',
            type: 'numberline',
            x: 220,
            y: 330,
            w: 560,
            from: -5,
            to: 5,
            originRing: true,
            pts: [
              { v: 3, lab: '3', c: K.red },
              { v: -3, lab: '-3', c: K.blue },
            ],
          },
          { id: 'pa-eq', type: 'eqline', x: 300, y: 190, s: 24, parts: [{ t: '丨a丨 ＝ a  ⇒  a 是非负数（a ≥ 0）' }], box: 'green' },
          { id: 'pa-t', type: 'text', x: 300, y: 250, t: '非负数 ＝ 大于或等于零的数', s: 20 },
        ],
      },
      {
        say: '好了，又到总结时间。首先你学会了一个新的概念叫绝对值，一个数到原点的距离就是它的绝对值。其次你还学会了如何去求任意一个数 a 的绝对值，根据它符号的不同有三种情况，当 a 大于零时，a 的绝对值等于 a，当 a 等于零时，a 的绝对值等于零，当 a 小于零时，a 的绝对值等于负 a。好了，就这样吧，快去做题，八嘎呀路。',
        drop: ['pa-eq', 'pa-t'],
        add: [
          { id: 'nl', type: 'numberline', x: 220, y: 330, w: 560, from: -5, to: 5, originRing: true, pts: [] },
          { id: 'sum-p', type: 'panel', x: 240, y: 158, w: 520, h: 230, title: '绝对值 · 总结', tc: K.red },
          { id: 'sum-1', type: 'text', x: 270, y: 210, t: '① 丨a丨 ＝ 数轴上 a 到原点的距离', s: 20 },
          { id: 'sum-2', type: 'text', x: 270, y: 258, t: '② a＞0：丨a丨＝a；a＝0：丨a丨＝0；a＜0：丨a丨＝-a', s: 19 },
          { id: 'sum-3', type: 'text', x: 270, y: 306, t: '③ 先判断符号，再求绝对值', s: 20 },
          { id: 'sum-4', type: 'text', x: 270, y: 352, t: '丨a丨 ＝ 3 ⇒ a ＝ ±3（两个答案）', s: 18, c: K.sub },
        ],
      },
    ],
  },
]
