import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord, faWeixin, faTelegram, faMediumM, faRedditAlien, faBitcoin, faTwitter, faFacebook, faYoutube, faGithub } from '@fortawesome/free-brands-svg-icons';

import styles from './SocialLinks.module.css';

export const SocialLinks = ({ size = 'full', centered = false }) => { // type full or short

  const links = [
    {
      name: "discord",
      icon: faDiscord,
      link: "https://discord.obyte.org/"
    },
    {
      name: "telegram",
      icon: faTelegram,
      link: "https://t.me/obyteorg",
    },
    {
      name: "weixin",
      icon: faWeixin,
      link: "https://mp.weixin.qq.com/s/JB0_MlK6w--D6pO5zPHAQQ"
    },
    {
      name: "twitter",
      icon: faTwitter,
      link: "https://twitter.com/ObyteOrg"
    },
    {
      name: "youtube",
      icon: faYoutube,
      link: "https://www.youtube.com/channel/UC59w9bmROOeUFakVvhMepPQ/"
    },
    {
      name: "medium",
      icon: faMediumM,
      link: "https://blog.obyte.org"
    },
    {
      name: "reddit",
      icon: faRedditAlien,
      link: "https://www.reddit.com/r/obyte/"
    },
    {
      name: "bitcoin",
      icon: faBitcoin,
      link: "https://bitcointalk.org/index.php?topic=1608859.0"
    },
    {
      name: "facebook",
      icon: faFacebook,
      link: "https://www.facebook.com/obyte.org"
    },
    {
      name: "github",
      icon: faGithub,
      link: "https://github.com/byteball/prediction-markets-aa"
    },
  ];

  return (<div className={styles.wrap}>
    <div className={styles.list} style={{ justifyContent: centered ? "center" : "flex-start" }}>
      {(size === "full" ? links : links.slice(0, 5)).map((social) => <a className={styles.item} key={"link-" + social.name} target="_blank" rel="noopener" href={social.link}><FontAwesomeIcon size="lg" icon={social.icon} /></a>)}
    </div>
  </div>)
}