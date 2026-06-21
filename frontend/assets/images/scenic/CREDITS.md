# VR 全景场景封面素材来源与许可

全景漫游页（`frontend/app/vr.tsx`）每个场景卡片 / Hero 的封面图，真实摄影、开放授权，
下载到本地随 App 打包引用（key 见 `frontend/lib/legacy-images.ts`），无 emoji、无运行时第三方 CDN 依赖。
主题统一为生态/自然/环境保护，尽量取场景真实地点。

| 文件 | 场景 | 来源（Wikimedia Commons） | 作者 | 许可证 |
|------|------|---------------------------|------|--------|
| `vr_shennongjia.jpg` | 神农架原始森林 | [Shennongjia virgin forests](https://commons.wikimedia.org/wiki/File:Shennongjia_virgin_forests.jpg) | Evilbish | CC BY-SA 3.0 |
| `vr_xixi.jpg` | 西溪湿地（湿地生态） | [Wetland sunrise water and reeds…](https://commons.wikimedia.org/wiki/File:Wetland_sunrise_water_and_reeds_in_foreground_with_plant_growth_in_background.jpg) | Ryan Hagerty (USFWS) | Public domain |
| `vr_solar.jpg` | 光伏电站（沙漠光伏） | [Building a Great Solar Wall in China](https://commons.wikimedia.org/wiki/File:Building_a_Great_Solar_Wall_in_China_(153759_-_2_20241208_lrg).jpg) | NASA Earth Observatory (Michala Garrison, USGS Landsat) | Public domain |
| `vr_zhangjiajie.jpg` | 张家界国家森林公园 | [Yellow Stone Village 37725-Zhangjiajie](https://commons.wikimedia.org/wiki/File:Yellow_Stone_Village_37725-Zhangjiajie_(49047532017).jpg) | xiquinhosilva | CC BY 2.0 |
| `vr_jiuzhaigou.jpg` | 九寨沟 | [Long Lake (Jiuzhaigou)](https://commons.wikimedia.org/wiki/File:Long_Lake_(Jiuzhaigou)_20260511-1.jpg) | Suicasmo | CC0 |
| `vr_windfarm.jpg` | 海上风电场 | [Norfolk coast, offshore wind farm UK 2015](https://commons.wikimedia.org/wiki/File:Norfolk_coast,_offshore_wind_farm_UK_2015.jpg) | johnkell | CC BY 2.0 |

> CC0 / Public domain 无需署名；CC BY / CC BY-SA 作品按上表记录作者 + 许可（CC BY-SA 以相同许可使用）。

---

# 景点 / 城市图片来源与许可（Scenic & City Image Credits）

各景点与广东城市卡片照片均为**对应真实地点**的开放授权图片，来源
**Wikimedia Commons**，缩放至宽 1280px（标准尺寸），随 App 打包、不走网络。
接入方式：`frontend/lib/legacy-images.ts` 中各后端图片 key 的 `require` 指向本目录文件；
下表「key」即后端 `scenic.image` 使用的 key。

| 文件 | key | 真实地点 | 作者 | 许可 | 来源（Wikimedia Commons） |
|------|-----|----------|------|------|----------------------------|
| `canton_tower.jpg` | `jd/gz.jpg` | 广州塔 Canton Tower（广州） | Tim Wu | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Canton_Tower_20220626_(cropped).jpg |
| `mount_danxia.jpg` | `jd/dxs.png` | 丹霞山 Mount Danxia（韶关） | Yumeto | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:20251102_Danxia_Shan_(152721).jpg |
| `happy_valley_guangzhou.jpg` | `jd/gzcl.png` | 广州欢乐谷 Happy Valley（广州） | Retailguychina | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Happy_Valley_Mall_at_night_(Guangzhou).JPG |
| `chimelong_ocean_kingdom.jpg` | `changlong.png` | 长隆海洋王国 Chimelong Ocean Kingdom（珠海） | xiquinhosilva | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Chimelong_Ocean_Kingdom_Avenue.jpg |
| `humen_bridge.jpg` | `dghmdq.jpg` | 虎门大桥 Humen Bridge（东莞） | xiquinhosilva | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Humen_Bridge_2019.jpg |
| `opium_war_museum_humen.jpg` | `dgypzzbwg.png` | 鸦片战争博物馆 / 海战博物馆（东莞虎门） | xiquinhosilva | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Opium_War_Museum_11420-Humen_(48754994287).jpg |
| `nanshe_ancient_village.jpg` | `gysgjslgy.png` | 南社明清古村落（东莞，岭南古村落） | Zhangzhugang | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Dongguan_Nanshe_2013.12.01_11-11-11.jpg |
| `city_guangzhou.jpg` | `xc/xc_guangzhou.jpg` | 广州 天际线 | 中少 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Guangzhou_Skyline_20190731.jpg |
| `city_shenzhen.jpg` | `xc/xc_shenzhen.jpg` | 深圳 天际线 | Fumikas Sagisavas | CC0 | https://commons.wikimedia.org/wiki/File:Skyline_in_Shenzhen_(20250327).jpg |
| `city_zhuhai.jpg` | `xc/xc_zhuhai.jpg` | 珠海（珠海渔女） | Iswzo | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Zhuhai_Fishing_Girl_Night_View.jpg |
| `city_chaozhou.jpg` | `xc/xc_chaozhou.jpeg` | 潮州（广济桥） | Akira CA | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Chaozhou_Guangji_Bridge_20191211.jpg |
| `city_dongguan.jpg` | `xc/xc_dongguan.jpg` | 东莞（黄旗山望市区） | David290 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:%E4%B8%9C%E8%8E%9E%E9%BB%84%E6%97%97%E5%B1%B1%E4%B8%8A%E6%9C%9B%E5%B8%82%E5%8C%BA_Jul_18,_2019_15-38-17.jpg |
| `city_huizhou.jpg` | `xc/xc_huizhou.jpg` | 惠州（西湖） | Chintunglee | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:West_Lake_in_Huizhou.jpg |
| `city_jiangmen.jpg` | `xc/xc_jiangmen.jpg` | 江门（开平碉楼·自力村云幻楼） | Stefan Fussan | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Zili_Village_Yunhuan_Lou_0005.jpg |
| `city_heyuan.jpg` | `xc/xc_heyuan.png` | 河源（源城） | Boris1601050607 | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Yuancheng01.jpg |
| `city_qingyuan.jpg` | `xc/xc_qingyuan.jpg` | 清远（小市天际线） | User:Alex Liu, User:Feelmore | Copyrighted free use | https://commons.wikimedia.org/wiki/File:Qingyuan_City_Xiaoshi_Skyline_Guangdong_Province.JPG |
| `city_zhaoqing.jpg` | `xc/xc_zhaoqing.jpg` | 肇庆（七星岩·卧龙阁与七星桥） | Jasonjiang.1998 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Wulong_Pavilion_%26_Qixing_Bridge,_Seven_Star_Crags_20260217.jpg |
| `city_jieyang.jpg` | `xc/xc_jieyang.jpeg` | 揭阳（进贤门城楼） | 13yxzou | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Jieyang_Gate_Tower.jpg |
| `city_meizhou.jpg` | `xc/xc_meizhou.jpg` | 梅州（客家围龙屋·兴宁） | HKB08 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Hakka_WeiLong_House_in_Xingning_City.jpg |
| `canton_tower_carousel_1.jpg` | `gz.jpg` | 广州塔（日间视角，详情轮播 1；同 `canton_tower.jpg`） | Tim Wu | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Canton_Tower_20220626_(cropped).jpg |
| `canton_tower_carousel_2.jpg` | `gz2.jpg` | 广州塔（夜景，详情轮播 2） | Shujianyang | CC0 | https://commons.wikimedia.org/wiki/File:Canton_Tower_at_night_01.jpg |
| `canton_tower_carousel_3.jpg` | `gz3.jpg` | 广州塔（花城广场视角，详情轮播 3） | そらみみ | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:View_of_Canton_Tower_from_Huacheng_Square.jpg |
| `canton_tower_carousel_4.jpg` | `gz4.jpg` | 广州塔（东山湖公园视角，详情轮播 4） | JULIANISME | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Canton_Tower,_taken_in_Dongshanhu_Park.jpg |

## 说明

- 「广州欢乐谷」取该乐园夜景实景；「长隆海洋王国」取珠海长隆海洋王国园区大道实景——均为该具体园区真实开放授权照片。
- 所有 CC BY / CC BY-SA 图片依许可保留原作者署名与来源链接；CC0 / Public domain / Copyrighted-free-use 图片无署名义务，仍如实记录来源。
- 许可全文：CC BY 2.0 <https://creativecommons.org/licenses/by/2.0/>，CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>，CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0/>，CC0 <https://creativecommons.org/publicdomain/zero/1.0/>。
