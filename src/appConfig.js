import i18n from "locale";

const feedNamesCurrencyOracle = ["BTC_USD", "1ECO_BTC", "1ECO_USD", "1INCH_USD", "1PECO_BTC", "1PECO_USD", "4ART_USD", "AAPL_USD", "AAVE_USD", "ABBC_USD", "ABNB_USD", "ABYSS_USD", "ACB_USD", "ADA_USD", "ADK_USD", "ADX_USD", "AGRS_USD", "AKN_USD", "AKRO_USD", "AKT_USD", "ALGO_BTC", "ALGO_USD", "AMC_USD", "AMD_USD", "AMP_USD", "AMZN_USD", "ANKR_USD", "ANT_USD", "APHA_USD", "APM_USD", "AR_BTC", "AR_USD", "ARDR_USD", "ARDX_USD", "ARIA20_USD", "ARK_USD", "ARKK_USD", "ARTII_USD", "ATOM_USD", "AVAX_USD", "BAAS_USD", "BABA_USD", "BAL_USD", "BAND_USD", "BAT_USD", "BB_USD", "BBC_USD", "BCH_BTC", "BCH_USD", "BFC_USD", "BIFI_USD", "BILI_USD", "BITW_USD", "BLK_USD", "BLOCK_USD", "BMP_USD", "BNS_USD", "BNT_USD", "BNTX_USD", "BOA_USD", "BONDLY_USD", "BOSON_USD", "BRZ_USD", "BST_USD", "BSV_BTC", "BSV_USD", "BTCV_USD", "BTE_USD", "BTM_USD", "BTR_BTC", "BTR_USD", "BTS_USD", "BTTOLD_USD", "BTU_USD", "BWX_USD", "BYND_USD", "CAMP_USD", "CBC_USD", "CEL_USD", "CELO_USD", "CGC_USD", "CGT_USD", "CKB_USD", "CLT_BTC", "CLT_USD", "CND_USD", "CNTM_USD", "COIN_USD", "COMP_USD", "COT_USD", "COVN_USD", "CPC_USD", "CRO_USD", "CRON_USD", "CRV_USD", "CRW_BTC", "CRW_USD", "CTC_USD", "CTXC_USD", "CUDOS_USD", "CURE_USD", "CUSD_USD", "CUT_USD", "CVC_USD", "CVT_USD", "CWC_BTC", "CWC_USD", "DAI_USD", "DASH_USD", "DAWN_USD", "DCR_USD", "DEP_USD", "DFCH_USD", "DFI_BTC", "DFI_USD", "DGB_USD", "DMT_USD", "DNA_USD", "DNT_BTC", "DNT_USD", "DOGE_BTC", "DOGE_USD", "DOT_BTC", "DOT_USD", "DRGN_USD", "DUSK_BTC", "DUSK_USD", "DVI_USD", "ECELL_USD", "ECOC_USD", "EDG_USD", "ELA_USD", "ELAMA_USD", "EMC2_USD", "ENG_USD", "ENJ_BTC", "ENJ_USD", "EOS_USD", "EQX_USD", "ETC_USD", "ETH_BTC", "ETH_USD", "EXCL_USD", "EXE_USD", "EXP_USD", "FB_USD", "FCT2_USD", "FCT_USD", "FIL_USD", "FIT_USD", "FLETA_USD", "FLO_USD", "FME_USD", "FNX_USD", "FOL_USD", "FOR_USD", "FTC_USD", "FX_USD", "GAME_USD", "GBYTE_BTC", "GBYTE_USD", "GDXJ_USD", "GEO_USD", "GET_USD", "GLD_USD", "GLEEC_USD", "GLM_USD", "GLXY_USD", "GME_USD", "GNC_USD", "GNO_BTC", "GNO_USD", "GNY_USD", "GO_USD", "GOOGL_USD", "GPYX_USD", "GRS_USD", "GRT_BTC", "GRT_USD", "GST_USD", "GXC_USD", "HBAR_USD", "HBD_USD", "HDAC_USD", "HDAO_USD", "HEDG_USD", "HIVE_USD", "HNS_USD", "HXRO_USD", "HYDRO_USD", "ICX_USD", "IGNIS_USD", "INSTAR_USD", "INX_USD", "INXT_USD", "IOC_USD", "IOST_USD", "IOTA_USD", "IOTX_USD", "IQQ_USD", "IRIS_USD", "JOB_USD", "KAI_USD", "KDA_USD", "KDAG_USD", "KLAY_USD", "KLV_USD", "KMD_USD", "KNC_USD", "KOK_USD", "KSM_USD", "LBC_USD", "LINK_USD", "LMCH_USD", "LOOM_USD", "LOON_USD", "LRC_USD", "LSK_USD", "LTC_USD", "LUCY_USD", "MAID_USD", "MANA_USD", "MARS4_USD", "MATIC_USD", "MDC_USD", "MDT_USD", "ME_USD", "MED_BTC", "MED_USD", "MEME_USD", "MER_USD", "META_USD", "MET_USD", "MFA_USD", "MFT_USD", "MIMO_USD", "MKR_USD", "MNW_USD", "MONA_USD", "MORE_BTC", "MORE_USD", "MRNA_USD", "MSTR_USD", "MTC_BTC", "MTC_USD", "MTL_USD", "MUE_USD", "MYCE_USD", "MYST_USD", "NAV_USD", "NEO_USD", "NFLX_USD", "NFTX_USD", "NGC_USD", "NIO_USD", "NKN_USD", "NLG_BTC", "NLG_USD", "NMR_BTC", "NMR_USD", "NOK_USD", "NVDA_USD", "NVT_USD", "NXS_USD", "NXT_USD", "OCEAN_USD", "OGN_USD", "OGT_USD", "OK_USD", "OMG_USD", "ONG_USD", "ONT_USD", "ORBS_USD", "OXEN_USD", "OXT_USD", "PAR_USD", "PART_USD", "PAY_USD", "PENN_USD", "PFE_USD", "PHNX_USD", "PIVX_USD", "PKT_USD", "PLA_USD", "PLAY_USD", "PMA_USD", "POT_USD", "POWR_USD", "PPAY_USD", "PPC_USD", "PROM_USD", "PTOY_USD", "PUNDIX_USD", "PXL_USD", "PYPL_USD", "PYR_USD", "QLC_USD", "QNT_USD", "QRL_USD", "QTUM_USD", "RAMP_USD", "REAL_USD", "REN_USD", "RENBTC_USD", "REPV2_USD", "REV_USD", "REVV_USD", "RFOX_USD", "RGT_USD", "RLC_USD", "RNB_USD", "ROOK_USD", "RSR_USD", "RVC_USD", "RVN_USD", "SAND_BTC", "SAND_USD", "SBD_USD", "SC_USD", "SENSO_USD", "SHR_USD", "SHX_USD", "SIG_USD", "SIGNA_USD", "SIX_USD", "SKM_USD", "SLICE_USD", "SLS_USD", "SLV_USD", "SMBSWAP_USD", "SNT_USD", "SNX_USD", "SOLVE_USD", "SPC_USD", "SPHR_USD", "SPI_USD", "SPY_USD", "SQ_USD", "SRN_BTC", "SRN_USD", "SSX_USD", "STC_USD", "STCCOIN_USD", "STEEM_USD", "STMX_USD", "STORJ_USD", "STPT_USD", "STRAX_USD", "STRK_USD", "SUKU_BTC", "SUKU_USD", "SUSHI_USD", "SXP_USD", "SYS_USD", "TEA_USD", "TEMCO_USD", "TFC_USD", "THC_USD", "TNC_USD", "TRAC_USD", "TRX_USD", "TRYB_USD", "TSHP_USD", "TSLA_USD", "TSM_USD", "TUDA_USD", "TUSD_BTC", "TUSD_USD", "TWTR_USD", "TYC_USD", "UBER_USD", "UBQ_BTC", "UBQ_USD", "UBT_BTC", "UBT_USD", "UMA_USD", "UNI_USD", "UNIX_USD", "UPCO2_USD", "UPEUR_USD", "UPP_USD", "UPT_USD", "UPUSD_USD", "UPXAU_USD", "UQC_USD", "URAC_USD", "URQA_USD", "USDC_USD", "USDN_USD", "USDP_USD", "USDS_USD", "USO_USD", "UTI_USD", "UTK_USD", "VAL_USD", "VANY_USD", "VBK_USD", "VEE_USD", "VET_USD", "VIA_USD", "VID_USD", "VIL_USD", "VITE_USD", "VLX_BTC", "VLX_USD", "VRA_USD", "VRC_USD", "VTC_USD", "WAVES_USD", "WAXP_USD", "WBTC_USD", "WICC_USD", "WINGS_USD", "WXBTC_USD", "XCF_USD", "XCN_BTC", "XCN_USD", "XDB_BTC", "XDB_USD", "XDC_USD", "XELS_BTC", "XELS_USD", "XEM_USD", "XLM_BTC", "XLM_USD", "XRP_BTC", "XRP_USD", "XST_USD", "XTP_USD", "XTZ_USD", "XUC_USD", "XVG_BTC", "XVG_USD", "XWC_BTC", "XWC_USD", "XYM_USD", "YLD_USD", "ZEC_USD", "ZEN_USD", "ZIL_USD", "ZM_USD", "ZRX_USD", "BTC_PERCENTAGE", "ETH_PERCENTAGE", "BNB_BTC", "BNB_USD"];
const feedNamesPreciousMetalOracle = ["XAG_BTC", "XAG_EUR", "XAG_GBP", "XAG_JPY", "XAG_USD", "XAG_XAU", "XAU_BTC", 'XAU_EUR', "XAU_GBP", "XAU_JPY", "XAU_USD", "XAU_XAG", "GBYTE_XAG", "GBYTE_XAU", "XAG_GBYTE", "XAU_GBYTE"];

export default {
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT,
  FACTORY_AAS: process.env.REACT_APP_FACTORY_AAS?.split(",") || [],
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  BASE_AAS: process.env.REACT_APP_BASE_AAS?.split(","),
  YES_COLOR: "#05c46b",
  NO_COLOR: "#ff5e57",
  DRAW_COLOR: "#ffc048",
  CATEGORIES: process.env.REACT_APP_ENVIRONMENT === 'testnet' ? {
    'currency': {
      oracles: [
        {
          address: process.env.REACT_APP_CURRENCY_ORACLE,
          name: i18n.t('oracles.cryptocurrency', 'Cryptocurrency prices oracle'),
          feedNames: feedNamesCurrencyOracle
        },
        {
          address: "H74QL4ZCDD5KTFOGGZQ37YJSOO3N34JI",
          name: 'Twoogi oracle',
          feedNames: ['TWOOGI_TEST', 'TESTNET_VALUE']
        }
      ]
    },
    'sport': {
      oracles: [
        {
          address: process.env.REACT_APP_SPORT_ORACLE,
          name: i18n.t('oracles.sports', 'Sports oracle')
        }
      ]
    }
  } : {
    'currency': {
      oracles: [
        {
          address: process.env.REACT_APP_CURRENCY_ORACLE,
          name: i18n.t('oracles.cryptocurrency', 'Cryptocurrency prices oracle'),
          feedNames: feedNamesCurrencyOracle
        },
        {
          address: process.env.REACT_APP_PRECIOUS_METAL_ORACLE,
          name: i18n.t('oracles.metal', 'Precious metal exchange rates oracle'),
          feedNames: feedNamesPreciousMetalOracle
        }
      ]
    },
    'sport': {
      oracles: [
        {
          address: process.env.REACT_APP_SPORT_ORACLE,
          name: i18n.t('oracles.sports_oracle', 'Sports oracle')
        }
      ]
    }
  },
  KNOWN_ORACLES: [
    process.env.REACT_APP_CURRENCY_ORACLE,
    process.env.REACT_APP_SPORT_ORACLE,
    process.env.REACT_APP_PRECIOUS_METAL_ORACLE
  ],
  GA_ID: process.env.REACT_APP_GA_ID
}