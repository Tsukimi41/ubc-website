import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { september14Diary as post } from "@/lib/diary-posts";

export const metadata: Metadata = {
  title: post.title,
  description: post.excerpt,
  alternates: { canonical: post.url },
  openGraph: {
    type: "article",
    title: post.title,
    description: post.excerpt,
    url: post.url,
    publishedTime: "2026-09-14T00:00:00+09:00",
  },
};

const sources = {
  wsda: { label: "ワシントン州農務局：養蜂とスズメバチの被害", url: "https://agr.wa.gov/departments/insects-pests-and-weeds/insects/hornets/beekeeping" },
  phases: { label: "ジョージア大学：オオスズメバチによる襲撃の三段階", url: "https://site.extension.uga.edu/fannin-gilmer/2020/05/asian-giant-hornet-murder-hornet/" },
  wsu: { label: "ワシントン州立大学：オオスズメバチと養蜂対策（PDF）", url: "https://cms.agr.wa.gov/WSDAKentico/Documents/PP/PestProgram/WSUAGHBeekeeperAdvice.pdf" },
  signal: { label: "玉川大学ほか：熱殺蜂球と防衛行動の研究（2012年・PDF）", url: "https://www.tamagawa.jp/graduate/news/pdf/detail_2345-20120315-01.pdf" },
  cost: { label: "玉川大学：熱殺蜂球がミツバチにもたらす負担（2018年）", url: "https://www.tamagawa.jp/graduate/news/detail_14741.html" },
  ecology: { label: "玉川学園：スズメバチの生活史と生態系での役割", url: "https://www.tamagawa.jp/introduction/tamagawa_trivia/tamagawa_trivia-18.html" },
  naro: { label: "農研機構：ニホンミツバチの遺伝資源としての特性", url: "https://www.naro.go.jp/project/results/laboratory/nilgs/1995/nilgs95-1-002.html" },
};

function Reference({ source }: { source: keyof typeof sources }) {
  const item = sources[source];
  return <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-leaf underline decoration-leaf/40 underline-offset-4 hover:decoration-leaf">{item.label}</a>;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-28 space-y-5 border-t border-bark/15 pt-10">
    <h2 className="text-2xl font-black leading-relaxed text-bark sm:text-3xl">{title}</h2>
    {children}
  </section>;
}

export default function September14DiaryPage() {
  return (
    <article className="page-shell py-12 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Link href="/diary" className="inline-flex items-center gap-2 font-bold text-leaf hover:underline"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
        <header className="mt-10">
          <p className="eyebrow">Bee diary / Field notes</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span className="rounded-full bg-peach/60 px-3 py-1 font-bold">{post.category}</span>
            <time dateTime={post.publishedAt}>2026年9月14日</time>
          </div>
          <h1 className="mt-6 text-3xl font-black leading-relaxed sm:text-4xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-9 text-bark/80">大学の養蜂場にスズメバチが多数飛来し、多くのミツバチが命を落としています。巣門まわりの隙間を通って出入りする大型の個体。いま、捕獲器と巣箱のつなぎ目を見直す必要があります。</p>
        </header>

        <aside className="mt-8 rounded-2xl border border-honey/50 bg-peach/25 p-6 text-sm leading-7">
          <p><strong>この記録について：</strong>9月14日の現場メモをもとに、観察された被害と検討中の対策をまとめました。メモの「大型」は体格についての表現で、種の同定結果は記録されていません。生態の解説では、蜂群への集団襲撃で知られる<strong>オオスズメバチ</strong>を中心に扱います。</p>
        </aside>

        <nav aria-label="記事の目次" className="mt-8 rounded-2xl bg-white/70 p-6">
          <p className="font-black">この記事で読むこと</p>
          <ol className="mt-4 grid list-inside list-decimal gap-3 text-sm leading-7 sm:grid-cols-2">
            <li><a href="#field" className="text-leaf hover:underline">大学で起きていること</a></li>
            <li><a href="#prey" className="text-leaf hover:underline">ミツバチが狙われる理由</a></li>
            <li><a href="#attack" className="text-leaf hover:underline">集団襲撃の怖さ</a></li>
            <li><a href="#defense" className="text-leaf hover:underline">ミツバチの防衛とその限界</a></li>
            <li><a href="#gaps" className="text-leaf hover:underline">隙間と捕獲器の関係</a></li>
            <li><a href="#plan" className="text-leaf hover:underline">板・金属プレート・底上げの案</a></li>
            <li><a href="#follow-up" className="text-leaf hover:underline">対策後に確認したいこと</a></li>
            <li><a href="#coexistence" className="text-leaf hover:underline">蜂群と人を守るために</a></li>
          </ol>
        </nav>

        <div className="mt-12 space-y-12 text-base leading-9 text-bark/80 sm:text-lg">
          <Section id="field" title="1. 両脇と正面の隙間が、出入り口になっている">
            <p>9月14日の現場では、巣門の周辺にある両横と前方の空間が広く、そこから大型のスズメバチが入り、ミツバチを襲っていることが問題になっています。スズメバチは脇や正面を自由に行き来でき、捕獲器へ入る前に外へ戻れる状態だという報告です。</p>
            <p>対策として挙がったのは、金属プレートをはめること、両横を板などでふさぐこと、そして巣門前の板を底上げして余分な空間を狭くすることです。捕獲器を置いてあっても、その横に通り抜けられる道が残っていれば、装置の想定した経路を通らずに接近されてしまいます。</p>
            <p>死亡数や被害を受けた巣箱数の集計は、このメモにはありません。そのため、被害の規模を数字で示すことはできませんが、多くのミツバチが犠牲になっているという現場の切迫感を、まず記録しておきます。以下の改修は、この時点では検討案です。</p>
          </Section>

          <Section id="prey" title="2. なぜミツバチの巣が狙われるのか">
            <p>ミツバチの巣には成虫だけでなく、多数の幼虫や蛹がまとまって暮らしています。オオスズメバチにとって、そこは自分たちの幼虫に与える動物性の餌が集中した場所です。捕まえた蜂や巣内の幼虫などを巣へ運び、次の世代を育てるために利用します。<Reference source="wsu" /></p>
            <p>「ハチミツを盗みに来る」というイメージだけでは、この襲撃の深刻さを捉えきれません。育児の場そのものが狙われ、そこを守る働き蜂も攻撃を受けます。ミツバチが花から食物を集める営みと、スズメバチがほかの昆虫を捕らえて子を育てる営みが、巣門でぶつかっているのです。</p>
            <p>晩夏から秋は、スズメバチの巣が大きくなり、次の世代の女王などを育てる時期と重なります。秋の養蜂では、巣箱の中の状態に加えて、巣門へ近づく外敵にも目を向ける必要があります。<Reference source="ecology" /></p>
          </Section>

          <Section id="attack" title="3. 怖いのは、大きさと「集団で巣を襲う」行動">
            <p>オオスズメバチは大顎でミツバチをかみ殺すことができ、硬い体も備えています。ミツバチが一匹ずつ立ち向かっても、容易に押し返せる相手ではありません。さらに深刻なのは、個々の蜂を捕まえる捕食が、蜂群全体への集団襲撃に発展する場合があることです。<Reference source="cost" /></p>
            <p>オオスズメバチのミツバチへの攻撃は、一般に次の三つの段階に分けて説明されます。ただし、すべての飛来が集団襲撃に進むわけではありません。<Reference source="phases" /></p>
            <ol className="space-y-4">
              <li className="rounded-2xl bg-peach/20 p-5"><h3 className="font-black text-bark">① 個体を捕らえる</h3><p className="mt-2">巣門の周辺などで働き蜂を捕まえ、餌として自分の巣へ持ち帰ります。</p></li>
              <li className="rounded-2xl bg-peach/30 p-5"><h3 className="font-black text-bark">② 集団で働き蜂を攻撃する</h3><p className="mt-2">複数の個体が同じ巣を襲い、防衛する働き蜂を次々に殺します。捕食される数匹の損失から、群れの存続を揺るがす被害へ変わります。</p></li>
              <li className="rounded-2xl bg-peach/40 p-5"><h3 className="font-black text-bark">③ 巣を占拠する</h3><p className="mt-2">防衛する蜂が失われると、巣を餌場として占拠し、幼虫や蛹を持ち出します。</p></li>
            </ol>
            <p>偵察する個体が巣の周辺につける化学的な目印も知られています。仲間への情報となるこの匂いを、ニホンミツバチが察知して防衛に備えることも報告されています。<Reference source="signal" /></p>
            <p>集団襲撃では、条件によっては数時間で蜂群が壊滅することがあります。「まだ数匹しか見ていない」ことだけで、被害も小さいと判断するのは危険です。これは一般的に知られる被害であり、今回の大学の蜂群が壊滅したと確認された、という意味ではありません。<Reference source="wsda" /></p>
          </Section>

          <Section id="defense" title="4. ミツバチにも防衛手段がある。でも、無敵ではない">
            <p>ニホンミツバチでよく知られるのが「熱殺蜂球」です。多数の働き蜂が相手を包み込み、筋肉を動かして熱を生み出します。研究では内部が約46〜47℃に達する例が示されています。相手との熱への耐性の差を利用する、集団ならではの防衛です。<Reference source="signal" /></p>
            <p>一方、この防衛には代償があります。玉川大学の研究では、蜂球に参加した働き蜂の余命が短くなることが示されました。外敵を撃退できても、群れを支える働き手に負担が残ります。蜂球を作れることを理由に、襲撃を放置してよいわけではありません。<Reference source="cost" /></p>
            <p>ニホンミツバチには、敵が巣門を通れない条件で出巣を控え、攻撃を避ける行動も報告されています。防衛は相手に飛びつくことだけでなく、接触そのものを減らすことも含みます。<Reference source="naro" /></p>
            <div className="overflow-x-auto rounded-2xl border border-bark/15">
              <table className="w-full min-w-[32rem] text-left text-sm leading-7">
                <caption className="bg-peach/25 px-5 py-3 text-left font-black text-bark">オオスズメバチへの防衛を考えるときの違い</caption>
                <thead className="bg-peach/15"><tr><th scope="col" className="p-4">ミツバチ</th><th scope="col" className="p-4">知られている特徴</th><th scope="col" className="p-4">養蜂での受け止め方</th></tr></thead>
                <tbody>
                  <tr className="border-t border-bark/10"><th scope="row" className="p-4">ニホンミツバチ</th><td className="p-4">熱殺蜂球などの集団防衛を持つ。</td><td className="p-4">防衛の負担があり、被害を受けない保証はない。</td></tr>
                  <tr className="border-t border-bark/10"><th scope="row" className="p-4">セイヨウミツバチ</th><td className="p-4">オオスズメバチへの同様の防衛を期待できず、集団襲撃に弱い。</td><td className="p-4">設備による接近・侵入の抑制が特に重要。</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm leading-7">この比較はオオスズメバチへの防衛に関するものです。セイヨウミツバチに防衛行動が一切ない、という意味ではありません。今回のメモでは飼育蜂の種も明記されていないため、現場の蜂種を断定せずに説明しています。<Reference source="signal" /></p>
          </Section>

          <Section id="gaps" title="5. 捕獲器があっても、横を通れたら守りきれない">
            <p>今回の対策の焦点は、捕獲器と巣門の周辺を一続きの構造として見直すことです。両脇や正面に広い隙間が残ると、スズメバチは捕獲部を通らずに巣門へ近づき、同じ隙間から戻ることができます。現場メモからは、この迂回経路が問題になっていると考えられます。</p>
            <p>巣門前に設ける捕獲器には、下側から入った個体を、上へ飛ぶ行動を利用して上部の捕獲室へ導く形式があります。ただし、逃げ出したり装置の外で待ち伏せしたりする場合もあり、設置だけで防除が完了するものではありません。<Reference source="wsu" /></p>
            <figure className="rounded-2xl border border-bark/15 bg-cream p-6">
              <figcaption className="font-black text-bark">現場メモから整理した、経路の見直し</figcaption>
              <div className="mt-5 grid gap-4 text-sm leading-7 sm:grid-cols-2">
                <div className="rounded-xl bg-peach/40 p-5"><h3 className="font-black text-bark">問題となっている経路</h3><p className="mt-3">両脇・正面の広い隙間<br />↓<br />巣門に接近して襲撃<br />↓<br />隙間から再び外へ</p></div>
                <div className="rounded-xl bg-leaf/10 p-5"><h3 className="font-black text-bark">改修で目指す状態</h3><p className="mt-3">余分な通り抜け経路をふさぐ<br />↓<br />捕獲器の所定の経路へ誘導<br />↓<br />上部の捕獲室へ入るかを確認</p></div>
              </div>
              <p className="mt-4 text-sm leading-7">仕組みを整理した概念図です。今回の装置の設計図や、捕獲を保証する施工方法ではありません。</p>
            </figure>
            <p>目指すのは、スズメバチが自由に通り抜けられる空間を減らしながら、ミツバチの出入りと巣の換気を保つことです。巣門を完全に閉じたり、どこでも一律に狭くしたりすることとは区別して考えます。</p>
          </Section>

          <Section id="plan" title="6. 板と金属プレートで、隙間を見直す案">
            <p>現場では、ネットの目の大きさだけに頼るよりも、板で必要な場所をふさぐ方が確実ではないか、という意見が出ています。ネットは目合いに加えて、たわみや端の取り付け方も含めて確認する必要があります。板にも端の隙間や固定の問題があり、材料だけで効果を決めつけず、装置全体で考えます。</p>
            <dl className="space-y-6">
              <div><dt className="font-black text-bark">両横を板などでふさぐ</dt><dd className="mt-2">巣箱と捕獲器の脇にある迂回経路を減らす案です。正面からだけでなく、左右の接合部にも出入りできる隙間が残っていないかを確認します。</dd></div>
              <div><dt className="font-black text-bark">金属プレートを取り付ける</dt><dd className="mt-2">巣門まわりの開口を調整する案です。どの位置に、どの形のプレートをはめるかは、使用中の巣箱・捕獲器の仕様に合わせる必要があります。メモからは部品の型式や寸法までは確定できません。</dd></div>
              <div><dt className="font-black text-bark">巣門前の板を底上げする</dt><dd className="mt-2">メモの「上底」は、ここでは板の位置を上げる「底上げ」として整理しています。前面や下側の余分な空間を狭め、横方向へ抜ける経路を減らすという考え方です。</dd></div>
              <div><dt className="font-black text-bark">上部の捕獲室につながる経路を保つ</dt><dd className="mt-2">余分な出口をふさいでも、捕獲器の誘導口までふさいでしまっては機能しません。設計上必要な通路と、閉じたい隙間を区別し、経験のある管理者が製品の説明に沿って調整することが前提です。</dd></div>
            </dl>
            <p>この記録には、実際の隙間の幅、捕獲器の形式、蜂の通行量の情報が揃っていません。そのため「何mmにすれば安全」と一律の寸法は示しません。また、底上げによって確実に上昇・捕獲するという効果も、現場で確かめる必要があります。</p>
          </Section>

          <Section id="follow-up" title="7. 捕獲数だけでなく、被害が減ったかを見る">
            <p>改修後に確認したいのは、「何匹捕まえたか」に加えて「ミツバチが守られているか」です。捕獲数が多くても、別の隙間からの侵入や、外での待ち伏せが続いていれば、対策を見直す余地があります。現場での評価項目として、次の記録を提案します。</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>どの巣箱の、どの方向からスズメバチが近づき、どこを通っているか。</li>
              <li>捕獲室に入る個体と、途中で外へ出る個体がそれぞれ見られるか。</li>
              <li>同じ時間帯・同程度の観察時間で、飛来やミツバチの死亡がどう変わったか。</li>
              <li>ミツバチの帰巣や出巣が滞っていないか。板やプレートで必要な通行・換気を妨げていないか。</li>
              <li>固定部のずれや、捕獲室・通路の詰まりが生じていないか。</li>
            </ul>
            <p>これは今後の観察案で、改修の実施や被害の減少を確認した報告ではありません。9月14日の課題は、自由な出入りを許している場所を特定し、そこをどう改善するかにあります。</p>
          </Section>

          <Section id="coexistence" title="8. ミツバチを守ることと、スズメバチを知ること">
            <p>ミツバチを失う側から見ると、スズメバチは非常に厳しい天敵です。一方、自然界ではほかの昆虫を捕食し、昆虫どうしの関係を形づくる存在でもあります。オオスズメバチはほかのスズメバチの巣を襲うことも知られています。養蜂場の被害への対処と、周囲の生き物を無差別に排除することは分けて考えたいところです。<Reference source="ecology" /></p>
            <p>人の安全にも注意が必要です。襲撃中や占拠された巣箱の近くでは危険が高まり、通常の養蜂用防護服を着ていれば必ず防げるとは限りません。見学者は近づかず、装置の調整や捕獲個体の扱いは経験のある管理者に任せ、必要に応じて大学の施設管理担当や専門業者と連携します。<Reference source="wsda" /></p>
            <p>小さな隙間でも、外敵には出入りできる道になります。ミツバチ自身の防衛能力に頼りきらず、巣門・捕獲器・板のつながりを丁寧に見直すこと。今回の被害を、蜂群を守る設備と観察の改善につなげていきたいと思います。</p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-bark/15 pt-8">
          <h2 className="text-xl font-black">参考資料</h2>
          <p className="mt-3 text-sm leading-7 text-bark/70">現場の状況と改修案は9月14日のメモに基づきます。生態の解説には以下の大学・研究機関・行政機関の資料を参照しています。海外資料の地域固有の報告・駆除制度は、日本での手順として扱っていません。</p>
          <ul className="mt-5 space-y-3 leading-7">{(Object.keys(sources) as (keyof typeof sources)[]).map((key) => <li key={key}><Reference source={key} /></li>)}</ul>
          <Link href="/diary" className="button-secondary mt-10"><ArrowLeft size={18} />養蜂日誌の一覧へ</Link>
        </footer>
      </div>
    </article>
  );
}
