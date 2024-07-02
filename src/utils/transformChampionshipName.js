import i18n from "locale";

export const transformChampionshipName = (name, code) => {
    if (name === 'Championship' && code === 'ELC') {
        return i18n.t('championships.soccer.ELC', 'England championship');
    } else if (name === "UEFA Champions League" && code === "CL") {
        return i18n.t('championships.soccer.CL', 'UEFA Champions League');
    } else if (name === "Bundesliga" && code === "BL1") {
        return i18n.t('championships.soccer.BL1', 'Bundesliga');
    } else if (name === "Ligue 1" && code === "FL1") {
        return i18n.t('championships.soccer.FL1', 'Ligue 1');
    } else if (name === "FIFA World Cup" && code === "WC") {
        return i18n.t('championships.soccer.WC', 'FIFA World Cup');
    } else if (code === "CSL") {
        return i18n.t('championships.soccer.CSL', 'Chinese Super League');
    } else if (name === "Campeonato Brasileiro Série A" && code === "BSA") {
        return i18n.t('championships.soccer.BSA', 'Campeonato Brasileiro Série A');
    } else if (name === "Liga Profesional" && code === "ASL") {
        return i18n.t('championships.soccer.ASL', 'Liga Profesional');
    } else if (name === "Eredivisie" && code === "DED") {
        return i18n.t('championships.soccer.DED', 'Eredivisie');
    } else if (name === "Primera Division" && code === "PD") {
        return i18n.t('championships.soccer.PD', 'Primera Division');
    } else if (name === "Primeira Liga" && code === "PPL") {
        return i18n.t('championships.soccer.PPL', 'Primeira Liga');
    } else if (name === "Campeonato Brasileiro Série B" && code === "BSB") {
        return i18n.t('championships.soccer.BSB', 'Campeonato Brasileiro Série B');
    } else if (name === "Serie A" && code === "SA") {
        return i18n.t('championships.soccer.SA', 'Serie A');
    } else if (name === "Premier League" && code === "PL") {
        return i18n.t('championships.soccer.PL', 'Premier League');
    } else if (name === "Copa Libertadores" && code === "CLI") {
        return i18n.t('championships.soccer.CLI', 'Copa Libertadores');
    } else {
        return name;
    }
}