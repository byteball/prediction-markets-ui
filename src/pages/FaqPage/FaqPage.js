import { Typography } from "antd";
import { Helmet } from "react-helmet-async";
import { Trans, useTranslation } from "react-i18next";

import styles from "./FaqPage.module.css";

export const FaqPage = () => {
  const { t } = useTranslation();

  return (<>
    <Helmet title={`Prophet prediction markets — ${t("pages.faq.title", "F.A.Q.")}`} />
    <Typography.Title level={1}>{t("pages.faq.title", "F.A.Q.")}</Typography.Title>

    <div className="faq">
      <div className={styles.collapse}>
        <div className={styles.panel} key="1">
          <h2>{t("pages.faq.items.1.question", "Who is this site for?")}</h2>
          <Trans i18nKey="pages.faq.items.1.answer">
            <p>This site is meant for two groups of users:</p>
            <ul>
              <li>Bettors wishing to make money by correctly predicting the outcomes of various events. The types of events include sports, currency exchange rates, politics, and many others.</li>
              <li>Liquidity providers wishing to make money by providing liquidity to prediction markets and earning transaction fees paid by bettors.</li>
            </ul>
          </Trans>
        </div>

        <div className={styles.panel} key="2">
          <h2>{t("pages.faq.items.2.question", "How do bettors make money?")}</h2>
          <Trans i18nKey="pages.faq.items.2.answer">
            <p>They buy the tokens of the outcome they believe. For example, if there is an upcoming game between team A and team B, and the bettor thinks that team A is going to win, they buy the tokens of team A. If their prediction turns out to be correct (team A wins) all the money staked by all the bettors are distributed among those who staked on the correct outcome, i.e. they get their money back, plus a share of the money staked on the wrong outcomes (team B and draw). If their outcome loses, they lose their stake.</p>
            <p>Bettors can also make money by buying/selling tokens that they believe are mispriced. For example, if they see that a token of team A is being sold for a price that doesn't reflect the true probability of team A winning, they can buy/sell the token or sell/buy the opposite tokens (team B and draw).</p>
            <p>Bettors also participate in liquidity provision and earn a portion of the fees paid by other bettors who traded <i>after</i> them. They get this share only if their outcome wins, and it amplifies their winnings.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="3">
          <h2>{t("pages.faq.items.3.question", "How do liquidity providers make money?")}</h2>
          <Trans i18nKey="pages.faq.items.3.answer">
            <p>Liquidity providers make money by buying all tokens (team A, team B, and draw) in proportions that reflect the probabilities of the corresponding outcomes and get a share of the fees paid by other traders who bought or sold any tokens <i>after</i> them. Unlike bettors, they do not bet on any specific outcome but instead bet on <i>all</i> outcomes and get their share of fees in any case. If the shares of the tokens are correct, liquidity provision is relatively low-risk activity, and the risk is proportional to the deviation of the token proportions from the true probabilities.</p>
            <p>Liquidity provision improves the trading conditions for bettors and encourages more trading, hence more fees. The more liquidity is committed to a market, the less is the slippage when buying or selling tokens.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="4">
          <h2>{t("pages.faq.items.4.question", "I made a bet and now I changed my mind. Can I exit the bet?")}</h2>
          <Trans i18nKey="pages.faq.items.4.answer">
            <p>Yes, you can sell the tokens that represent your bet while trading is still active (see below about the trading period). Alternatively, you can buy the opposite tokens that complement your bet (if you bought team A before, you can buy team B and draw now), this will make your position neutral and you'll act as a liquidity provider from now on. There are fees involved in both cases and if the sell fee is larger than the buy fee (this is the default), buying the opposite tokens might be a better idea.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="5">
          <h2>{t("pages.faq.items.5.question", "When can I make/exit my bets?")}</h2>
          <Trans i18nKey="pages.faq.items.5.answer">
            <p>For sports and most other markets, trading is active up to the date of the event (for sports, that's the start of the game). In currency markets, there is also a <i>quiet period</i> before the date of the event, and trading stops some time in advance. For example, in a market "Will BTC be above $30,000 on Sep 1, 2022 UTC?" trading will stop some time before Sep 1, 2022 UTC to protect the bets of the users as the exchange rate is unlikely to make large movements in a short period of time and the outcome becomes almost certain some time before the specified date.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="6">
          <h2>{t("pages.faq.items.6.question", "Is in-game trading allowed?")}</h2>
          <Trans i18nKey="pages.faq.items.6.answer">
            <p>No. Due to the way the token prices are determined, in-game trading on Prophet would hurt the winnings of the bettors who do not trade during the game. However, you can list the tokens on <a href="https://odex.ooo" target="_blank" rel="noopener">ODEX decentralized exchange</a> and trade them there against other in-game traders. This won't affect the winnings of those who prefer to make their bets and wait for the final outcome.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="7">
          <h2>{t("pages.faq.items.7.question", "What are the fees?")}</h2>
          <Trans i18nKey="pages.faq.items.7.answer">
            <p>The fees are set by the market creators and vary by market. The default is 1% for buying tokens and 2% for selling them. The fees do not apply if you trade the tokens elsewhere, e.g. on <a href="https://odex.ooo" target="_blank" rel="noopener">ODEX</a>. There are no fees for withdrawing your winnings after the outcome becomes known.</p>
            <p>There is also an additional fee called <i>arbitrageur profit tax</i> which is proportional to the price change caused by the trade. When our markets are arbitraged against similar markets on other platforms, this tax helps to collect most of the arbitrageur profit in favor of the liquidity providers. The default arb profit tax is 90%.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="8">
          <h2>{t("pages.faq.items.8.question", "Are token prices equal to the probabilities that the market believes?")}</h2>
          <Trans i18nKey="pages.faq.items.8.answer">
            <p>No, they reflect the probabilities but are not equal to them. The shares of the total capital invested in specific tokens are instead equal to the market's beliefs of their probabilities. They are displayed in the pie chart on the market's page.</p>
            <p>The capital invested in a token is proportional to both the token price and the number of issued tokens, and the number of tokens is proportional to their price, so the capital (and the probability) is proportional to the token's price <i>squared</i>. The sum of the squared token prices is not exactly 1, it is above 1 and grows as trading goes on due to the accrued fees.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="9">
          <h2>{t("pages.faq.items.9.question", "How are the tokens priced?")}</h2>
          <Trans shouldUnescape={true} i18nKey="pages.faq.items.9.answer">
            <p>The tokens are issued on a bonding curve and their prices depend on the numbers of tokens already issued. Issuing (buying) more tokens that represent a bet on the specific outcome (e.g. team A wins) increases their price and decreases the prices of the tokens that represent all other outcomes (team B wins and draw). Selling the same tokens does the opposite.</p>
            <p>The bonding curve is a formula that links the token supplies (<i>s</i><sub>yes</sub>, <i>s</i><sub>no</sub>, and <i>s</i><sub>draw</sub>) to the total capital invested in all tokens (the reserve, denoted as <i>r</i>):</p>
            <p style={{ fontSize: "larger" }}>
              <i>r</i> &nbsp; = &nbsp;
              <i>c </i> &nbsp;
              <span style={{ whiteSpace: "nowrap", verticalAlign: 'middle' }}>
                √<span style={{ borderTop: '1px solid #fff' }}>&nbsp;<i>s</i><sub><small>yes</small></sub><sup><small>2</small></sup> + <i>s</i><sub><small>no</small></sub><sup><small>2</small></sup> + <i>s</i><sub><small>draw</small></sub><sup><small>2</small></sup>&nbsp;</span>
              </span>
            </p>
            <p>where <i>c</i> is a coefficient that starts with 1 and gradually grows to account for the accrued fees.</p>
            <p>The price of the YES-token that represents a bet that the event will actually happen is then determined as a partial derivative by <i>s</i><sub>yes</sub>:</p>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: -10, fontSize: "larger", marginBottom: 10 }}>
              <div style={{ marginTop: -10 }}>
                <i>p</i><sub><small>yes</small></sub> &nbsp; = &nbsp;
                <i>c </i> &nbsp;&nbsp;
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', }}>
                <div>
                  <i>s</i><sub><small>yes</small></sub>
                </div>
                <div style={{ borderTop: '1px solid #fff', paddingTop: 5 }}>
                  <span style={{ whiteSpace: "nowrap" }}>
                    √<span style={{ borderTop: '1px solid #fff' }}>&nbsp;<i>s</i><sub><small>yes</small></sub><sup><small>2</small></sup> + <i>s</i><sub><small>no</small></sub><sup><small>2</small></sup> + <i>s</i><sub><small>draw</small></sub><sup><small>2</small></sup>&nbsp;</span>
                  </span>
                </div>
              </div>
            </div>


            <p>and similar formulas for the prices of NO and DRAW tokens.</p>
            <p>Thanks to the bonding curve, we have continuous pricing and it is always possible to buy or sell any tokens, i.e. liquidity is always available.</p>
            <p>The bonding curve is implemented by an <a href="https://obyte.org/platform/autonomous-agents" target="_blank" rel="noopener">Autonomous Agent</a>, and the AA acts like a decentralized automated bookmaker that automatically adjusts its prices in response to the changing demand. LPs act like shareholders of the decentralized bookmaker, and share its profits.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="10">
          <h2>{t("pages.faq.items.10.question", "How is Prophet different from other prediction market platforms?")}</h2>
          <Trans shouldUnescape={true} i18nKey="pages.faq.items.10.answer">
            <p>Most other prediction market platforms also issue YES and NO tokens that represent the corresponding outcomes, however these platforms make users trade against each other on an orderbook exchange. This makes it difficult to bootstrap liquidity without a large trader community. Even with a large community, liquidity is lacking in the less popular markets.</p>
            <p>Prophet issues tokens on a bonding curve instead. This means that traders are trading against the pool (which is implemented as an <a href="https://obyte.org/platform/autonomous-agents" target="_blank" rel="noopener">Autonomous Agent</a> —AA) rather than against each other, and liquidity is always available.</p>
            <p>Prophet compares against other prediction market platforms as AMM (automated market maker) DEXes compare against orderbook DEXes. The latter have always been struggling to gain traction due to low liquidity while AMM DEXes (like Uniswap) saw a lot more adoption.</p>
            <p>However, unlike other prediction market platforms, the numbers of YES and NO tokens issued by Prophet AAs are not equal, and their prices are not equal to market-implied probabilities, which makes it slightly harder to read the market. Also, the prices of the tokens move in a tighter range which reduces the opportunities to profit from significant price movements. We believe these downsides are not significant as in practice most trading happens in a narrow range and the probabilities are easily estimated as the amounts of capital staked on the corresponding outcomes.</p>
            <p>It's also important that Prophet works on <a href="https://obyte.org" target="_blank" rel="noopener">Obyte</a> — a DAG based cryptocurrency platform, which is immune to miner abuse and manipulation (known as MEV —miner extractable value) that affects blockchains. Therefore, when trading the prediction tokens, the risks of front-running, sandwich attacks, transaction delay or reordering and other attacks are minimized.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="11">
          <h2>{t("pages.faq.items.11.question", "Who operates Prophet?")}</h2>
          <Trans i18nKey="pages.faq.items.11.answer">
            <p>Nobody. Every market is operated by its own <a href="https://obyte.org/platform/autonomous-agents" target="_blank" rel="noopener">Autonomous Agent</a> which is a piece of autonomous (as the name implies) immutable code running on Obyte DAG in totally manless manner. Nobody can stop them, nobody can intervene with their operation. Their code, as well as all their activity, are fully transparent.</p>
            <p>Anyone can start a new market and it becomes immediately available to everyone.</p>
            <p>This website is open-source and anyone can start any number of copies of this website anywhere in the world by downloading its code from <a href="https://github.com/byteball/prediction-markets-ui" target="_blank" rel="noopener">github</a>.</p>
            <p>By engaging with this website, you are engaging with the Autonomous Agents the website offers an interface to, not with any companies, organizations, or individuals. There is no contract. You do not acquire any rights or obligations towards anyone, and nobody acquires any rights or obligations towards you.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="12">
          <h2>{t("pages.faq.items.12.question", "What are the sources of data about outcomes?")}</h2>
          <Trans i18nKey="pages.faq.items.12.answer">
            <p>They vary from market to market. For sports and currency markets, the data is provided by sports data providers such as <a href="https://www.football-data.org" target="_blank" rel="noopener">football-data.org</a>, cryptocurrency, and forex exchanges. The data is then posted to Obyte DAG by oracles operated by well-known Obyte community members. Anyone can create any market and use any oracle they like. This website displays a warning if the oracle is not among the known ones. You do have to trust the oracle operator that they post the true outcome (however, if they don't, everybody can see that). It is also possible to use decentralized oracles to completely remove any trust requirements.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="13">
          <h2>{t("pages.faq.items.13.question", "My prediction won, how do I get my payout?")}</h2>
          <Trans i18nKey="pages.faq.items.13.answer">
            <p>You have to claim it from the market where you made your bet. The market should be in "Claiming profit" state. If it is still in "Waiting for results" state then the market hasn't received the outcome yet. If the oracle has already posted the outcome, you can click the "Commit" button for the market to check the oracle's outcome and transition to "Claiming profit" state. Once in "Claiming profit" state, you can claim your profit by sending the winning tokens to the market's AA and receiving your share of the market's total balance.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="14">
          <h2>{t("pages.faq.items.14.question", "What is 'Resumed trading' state?")}</h2>
          <Trans i18nKey="pages.faq.items.14.answer">
            <p>A market can enter this state if the final outcome was not committed to the market within the allotted time (5 days by default). This can happen e.g. if the oracle failed to post the outcome, which is likely if the game was cancelled or postponed. In order not to lock user funds indefinitely, the market resumes trading after the waiting period expires in order to allow the token holders to sell them.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="15">
          <h2>{t("pages.faq.items.15.question", "Can I make bets if I have no funds on Obyte?")}</h2>
          <Trans i18nKey="pages.faq.items.15.answer">
            <p>Yes, you can, if you have funds on Ethereum, BSC, or Polygon. Prophet is integrated with other networks using <a href="https://github.com/byteball/counterstake-sdk" target="_blank" rel="noopener">Counterstake SDK</a> that allows to seamlessly send funds cross-chain to dapps on Obyte. You can make bets with USDC, ETH, or WBTC, and they will be automatically sent through <a href="https://counterstake.org" target="_blank" rel="noopener">Counterstake Bridge</a>, then converted to the required token via <a href="https://oswap.io" target="_blank" rel="noopener">Oswap.io</a> and sent to Prophet. However, you still need to have Obyte wallet in order to receive the tokens you bought and to claim profit afterwards.</p>
          </Trans>
        </div>

        <div className={styles.panel} key="16">
          <h2>{t("pages.faq.items.16.question", "What format of odds do you display on the website?")}</h2>
          <Trans i18nKey="pages.faq.items.16.answer">
            <p>We use decimal odds. They show the multiplier applied to your stake if your bet wins. It is possible to see the token prices as well by switching the display format in the upper right corner.</p>
          </Trans>
        </div>
      </div>
    </div>

    <div className={styles.otherQuestionsWrap}><Trans i18nKey="pages.faq.other_questions">Other questions? Ask on <a href="https://discord.obyte.org" target="_blank" rel="noopener">Obyte discord</a>.</Trans></div>
  </>)
}