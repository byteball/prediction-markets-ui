export const transformChampionshipName = (name, code) => {    if (name === 'Championship' && code === 'ELC') {
        return 'England championship'
    } else {
        return name;
    }
}