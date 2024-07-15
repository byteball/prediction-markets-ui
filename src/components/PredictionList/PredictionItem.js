import { Fragment, memo, useEffect, useRef, useState } from "react";
import { TinyLine } from '@ant-design/plots';
import useResizeObserver from '@react-hook/resize-observer';
import { Badge, Card, Col, Row, Typography } from "antd";
import { Link } from "react-router-dom";
import moment from 'moment';
import { useSelector } from 'react-redux';
import { kebabCase, min } from 'lodash';
import { Img } from 'react-image';
import { Trans, useTranslation } from "react-i18next";

import { selectLanguage, selectPriceOrOdds, selectReservesRate } from 'store/slices/settingsSlice';

import { CreateNowModal } from "modals";
import { generateTextEvent } from "utils";
import { useWindowSize } from "hooks";

import i18n from "locale";
import appConfig from "appConfig";

import styles from "./PredictionItem.module.css";

const max_display_decimals = 5;

export const PredictionItem = memo(({ reserve_asset = 'base', aa_address, reserve = 0, reserve_decimals = 0, yes_price = 0, no_price = 0, draw_price = 0, allow_draw, event_date, candles, reserve_symbol, yes_symbol, result, waiting_period_length, feed_name, expect_datafeed_value, datafeed_value, oracle, comparison, yes_team_id, no_team_id, yes_team, no_team, supply_yes = 0, supply_no = 0, supply_draw = 0, preview, apy = 0, quiet_period = 0, yes_crest_url = null, no_crest_url = null, league, coef }) => {
  const infoWrapRef = useRef();
  const [width] = useWindowSize();
  const { t } = useTranslation();

  const [infoHeight, setInfoHeight] = useState();
  const [dataForChart, setDataForChart] = useState([]);
  const [config, setConfig] = useState({
    autoFit: true,
    smooth: true,
    renderer: 'svg',
    animation: false,
    theme: {
      background: 'transparent'
    },
    meta: {
      nice: true
    },
    color: "#2D72F6"
  });

  const reservesRates = useSelector(selectReservesRate);
  const priceOrOdds = useSelector(selectPriceOrOdds);
  const lang = useSelector(selectLanguage);

  useResizeObserver(infoWrapRef, (entry) => {
    setInfoHeight(entry.target.clientHeight);
  });

  const now = moment.utc().unix();
  const isExpiry = now > event_date;
  const exists = !!aa_address || preview;
  const currentReserveRate = reservesRates[reserve_asset] || 0;

  useEffect(async () => {
    const data = preview ? candles : (candles ? (candles.length === 1 ? [...candles, ...candles] : candles) : []).map(({ price }) => price);

    const minValue = min(data);

    setConfig(c => ({
      ...c,
      tooltip: {
        customContent: (_, data) => {
          if (data && data[0]) {
            const { value } = data[0];
            const tokenView = yes_team || yes_symbol || t("common.type_token", "{{type}} token", { type: t("common.yes", "yes").toUpperCase() });
            const valueView = +Number(+value + minValue).toFixed(max_display_decimals);

            return <Trans i18nKey="prediction_item.chart_tooltip">{{ token: tokenView }} price - {{ value: valueView }} {{ symbol: reserve_symbol }}</Trans>
          }
        }
      }
    }));

    setDataForChart(data.map((value) => value - minValue));
  }, [candles, yes_symbol]);

  // views
  const reserveView = +Number(reserve / 10 ** reserve_decimals).toPrecision(max_display_decimals);
  const yesPriceView = +Number(yes_price).toPrecision(max_display_decimals);
  const noPriceView = +Number(no_price).toPrecision(max_display_decimals);
  const drawPriceView = +Number(draw_price).toPrecision(max_display_decimals);
  const apyView = apy ? (apy < 1000 ? t("prediction_item.lp_apy", `Liquidity provider APY: {{apy}}%`, { apy: `${Number(apy).toFixed(2)}` }) : t("prediction_item.apy_not_shown", 'APY not shown')) : t("prediction_item.apy_not_available", 'APY not available yet');

  const eventView = generateTextEvent({
    event_date,
    feed_name,
    datafeed_value: expect_datafeed_value || datafeed_value,
    oracle,
    comparison
  });

  const eventViewUTC = generateTextEvent({
    event_date,
    feed_name,
    datafeed_value: expect_datafeed_value || datafeed_value,
    oracle,
    comparison,
    isUTC: true,
    yes_team_name: yes_team,
    no_team_name: no_team
  });

  // wrappers configure
  const Wrapper = isExpiry && aa_address ? Badge.Ribbon : Fragment;
  let status = '';
  let color = 'red'

  if (isExpiry) {
    if (result) {
      status = t("common.status.claiming", 'Claiming profit');
      color = appConfig.YES_COLOR
    } else {
      if (now > (event_date + waiting_period_length)) {
        status = t("common.status.resumed", 'Resumed trading');
      } else {
        status = t("common.status.waiting", 'Waiting for results');
        color = '#e58e26'
      }
    }
  }

  const wrapperProps = isExpiry && aa_address ? {
    color,
    text: <div style={{ fontSize: 12 }}>{status}</div>,
    placement: "start"
  } : {};

  const isSportMarket = !!appConfig.CATEGORIES.sport.oracles.find(({ address }) => address === oracle);
  const marketHasCrests = isSportMarket ? yes_team_id !== undefined && no_team_id !== undefined : false;
  const SecondWrapper = exists && !preview ? Link : Fragment;

  const seoText = kebabCase(eventViewUTC);
  const langPath = (!lang || lang === 'en') ? '' : `/${lang}`;
  const secondWrapperProps = exists ? { to: `${langPath}/market/${seoText}-${aa_address}` } : {};

  // calc odds
  let yesOddsView = 0;
  let drawOddsView = 0;
  let noOddsView = 0;

  if (reserve !== 0) {
    yesOddsView = supply_yes !== 0 ? +Number((reserve / supply_yes) / yes_price).toFixed(5) : 0;
    noOddsView = supply_no !== 0 ? +Number((reserve / supply_no) / no_price).toFixed(5) : 0;
    drawOddsView = supply_draw !== 0 ? +Number((reserve / supply_draw) / draw_price).toFixed(5) : 0;
  }

  let winnerPriceView = 0;
  let winnerOddsView = 0;

  if (result && reserve) {
    const winnerSupply = result === 'yes' ? supply_yes : (result === 'no' ? supply_no : supply_draw);

    if (winnerSupply) {
      winnerPriceView = +Number(reserve / winnerSupply).toFixed(5);
      winnerOddsView = +Number(reserve ** 2 / (winnerSupply ** 2 * coef ** 2)).toPrecision(5);
    }
  }

  let yesValue = null;
  let noValue = null;
  let drawValue = null;

  let yesSubValue = null;
  let noSubValue = null;
  let drawSubValue = null;

  if (reserve === 0 && !result && priceOrOdds !== 'price') {
    if (!isSportMarket) {
      yesValue = '-';
      noValue = '-';

      if (allow_draw) {
        drawValue = '-';
      }
    }
  } else if (!result) {
    const anySupply = supply_yes + supply_no;

    if (supply_yes || (priceOrOdds === 'price' && anySupply)) {
      yesValue = priceOrOdds === 'price' ? `${yesPriceView || 0} ${reserve_symbol}` : `x${yesOddsView}`;
    } else if (!isSportMarket || (isSportMarket && supply_no)) {
      yesValue = '-';
    }

    if (supply_no || (priceOrOdds === 'price' && anySupply)) {
      noValue = priceOrOdds === 'price' ? `${noPriceView || 0} ${reserve_symbol}` : `x${noOddsView}`;
    } else if (!isSportMarket || (isSportMarket && supply_yes)) {
      noValue = '-';
    }

    if (allow_draw) {
      if (supply_draw || (priceOrOdds === 'price' && anySupply)) {
        drawValue = priceOrOdds === 'price' ? `${drawPriceView || 0} ${reserve_symbol}` : `x${drawOddsView}`;
      } else if (!isSportMarket || anySupply) {
        drawValue = '-';
      }
    }

    if (priceOrOdds === 'price' && currentReserveRate && !isSportMarket) {

      yesSubValue = `$${+Number(yes_price * currentReserveRate).toFixed(2)}`;
      noSubValue = `$${+Number(no_price * currentReserveRate).toFixed(2)}`;

      if (allow_draw) {
        drawSubValue = `$${+Number(draw_price * currentReserveRate).toFixed(2)}`;
      }
    }

  } else if (result) {
    yesValue = t('common.loser', 'LOSER');
    noValue = t('common.loser', 'LOSER');

    if (allow_draw) {
      drawValue = t('common.loser', 'LOSER');
    }

    if (result === 'yes') {
      yesValue = supply_yes ? (priceOrOdds === 'price' ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : t('common.winner', 'WINNER');
    } else if (result === 'no') {
      noValue = supply_no ? (priceOrOdds === 'price' ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : t('common.winner', 'WINNER');
    } else if (result === 'draw' && allow_draw) {
      drawValue = supply_draw ? (priceOrOdds === 'price' ? `${winnerPriceView} ${reserve_symbol}` : `x${winnerOddsView}`) : t('common.winner', 'WINNER');
    }
  }

  const priceOrOddsView = priceOrOdds === 'odds' ? t("common.odds", "odds") : t("common.price", "price");

  return <Wrapper {...wrapperProps}>
    <SecondWrapper {...secondWrapperProps}>
      <Card className={styles.itemWrap} style={{ opacity: isExpiry ? 0.5 : 1 }}>
        <Row gutter={10} align="middle">
          <Col md={{ span: 16 }} xs={{ span: 24 }} sm={{ span: 24 }} ref={infoWrapRef}>
            {!marketHasCrests ? <div className={styles.eventDesc}>
              {eventView}
            </div> : <div style={{ marginTop: 5 }}>
              <Row gutter={8} align={(exists && allow_draw && (drawOddsView || result) && width >= 576) ? "bottom" : 'middle'}>
                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
                  <Img unloader={<img className={styles.crests} alt={yes_team} src="/plug.svg" />} src={yes_crest_url}
                    className={styles.crests}
                    container={(children) => <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {children}
                      {result === 'yes' && <div style={{ position: 'absolute', right: 'calc(50% - 40px)', bottom: -10 }}>
                        <WinnerIcon />
                      </div>}
                    </div>
                    } />
                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.YES_COLOR }} className={styles.team} ellipsis={true}><small>{yes_team}</small></Typography.Text>
                  </div>

                  {exists && yesValue && noValue ? <div style={{ color: appConfig.YES_COLOR }}><span className={styles.price}>{yesValue}</span></div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }} className={styles.draw}>
                  <b style={{ fontSize: lang === "ru" || lang === "uk" ? 14 : 24 }}>{t('common.vs', 'VS')}</b>
                  <div className={styles.time}>
                    <small>{moment.unix(event_date).format(i18n.language === "en" ? 'MMM DD, LT' : i18n.language === "zh" ? 'MMM Do LT' : 'D MMM LT')}</small>
                  </div>
                  {(exists && allow_draw && (drawOddsView || result) && width >= 576) ? <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div className={styles.team}><small>{t('common.draw', 'draw')}</small></div>
                    <div style={{ color: appConfig.DRAW_COLOR }}><span className={styles.price}>{drawValue}</span></div>
                  </div> : null}
                </Col>

                <Col sm={{ span: 8 }} xs={{ span: 8 }} style={{ textAlign: 'center' }}>
                  <Img
                    src={no_crest_url}
                    className={styles.crests}
                    unloader={<img className={styles.crests} alt={no_team} src="/plug.svg" />}
                    container={(children) => <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {children}
                      {result === 'no' && <div style={{ position: 'absolute', right: 'calc(50% - 40px)', bottom: -10 }}>
                        <WinnerIcon />
                      </div>}
                    </div>
                    }
                  />

                  <div className={styles.teamWrap}>
                    <Typography.Text style={{ color: appConfig.NO_COLOR }} className={styles.team} ellipsis={true}>
                      <small>{no_team}</small>
                    </Typography.Text>
                  </div>

                  {exists && noValue && yesValue ? <div style={{ color: appConfig.NO_COLOR }}><span className={styles.price}>{noValue}</span></div> : null}
                </Col>
              </Row>
            </div>}
            {(exists && !isSportMarket) ? <Row className={styles.infoWrap} gutter={10}>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div>
                  <div className={styles.infoTitle}>{t("pages.market.cards.reserve.title", "Reserve")}</div>
                  <div>{reserveView} <small>{reserve_symbol}</small></div>
                  {(priceOrOdds === 'price' && currentReserveRate && !result) ? <div className={styles.infoValueInDollar}>${+Number(reserveView * currentReserveRate).toFixed(2)}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.YES_COLOR }}>
                  <div className={styles.infoTitle}>{t('common.yes', 'yes')} {priceOrOddsView}</div>
                  <div style={{ fontSize: 13 }}>{yesValue}</div>
                  {yesSubValue ? <div className={styles.infoValueInDollar}>{yesSubValue}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                <div style={{ color: appConfig.NO_COLOR }}>
                  <div className={styles.infoTitle}>{t('common.no', 'no')} {priceOrOddsView}</div>
                  <div style={{ fontSize: 13 }}>{noValue}</div>
                  {noSubValue ? <div className={styles.infoValueInDollar}>{noSubValue}</div> : null}
                </div>
              </Col>
              <Col md={{ span: 6 }} xs={{ span: 12 }}>
                {allow_draw ? <div>
                  <div className={styles.infoTitle}>{t('common.draw', 'draw')} {priceOrOddsView}</div>
                  <div style={{ color: appConfig.DRAW_COLOR }}>
                    <div style={{ fontSize: 13 }}>{drawValue}</div>
                    {drawSubValue ? <div className={styles.infoValueInDollar}>{drawSubValue}</div> : null}
                  </div>
                </div> : null}
              </Col>
            </Row> : null}
          </Col>
          {width >= 768 && aa_address ? <div className={styles.apyWrap}>
            {apyView}
          </div> : null}
          {(exists || preview) ? (infoHeight && dataForChart.length > 0 ? <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }} style={{ display: 'flex', alignItems: 'center' }}>
            {width >= 768 ? <div style={{ height: infoHeight - 20, marginTop: 10, width: '100%', boxSizing: 'border-box' }}>
              <TinyLine {...config} data={dataForChart} />
            </div> : null}
          </Col> : null) : <Col md={{ span: 8 }} xs={{ span: 24 }} sm={{ span: 24 }}>
            <div className={styles.createNowWrap}>
              <CreateNowModal
                feed_name={feed_name}
                oracle={oracle}
                event_date={event_date}
                event={eventView}
                expect_datafeed_value={expect_datafeed_value}
                waiting_period_length={waiting_period_length}
                no_team={no_team}
                yes_team={yes_team}
                quiet_period={quiet_period}
                comparison={comparison}
                yes_crest_url={yes_crest_url}
                no_crest_url={no_crest_url}
                league={league}
              />
            </div>
          </Col>}
        </Row>
      </Card>
    </SecondWrapper>
  </Wrapper>
});

const WinnerIcon = () => <img src="/winner-icon-stroke.svg" style={{ width: 32 }} alt="" />