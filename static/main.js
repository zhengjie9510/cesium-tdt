// 替换为自己的天地图浏览器端 Key，并在天地图控制台配置域名白名单。
const token = 'cec5eeadc16a3c964451ff083266df0c';
const tdtUrl = 'https://t{s}.tianditu.gov.cn/';
const subdomains = ['0', '1', '2', '3', '4', '5', '6', '7'];

const viewer = new Cesium.Viewer('cesiumContainer', {
    infoBox: false,
    baseLayerPicker: false,
    geocoder: false,
    terrainProvider: createTerrainProvider(),
    baseLayer: new Cesium.ImageryLayer(createImageryProvider('img_w')),
    timeline: false,
    animation: false
});
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.imageryLayers.addImageryProvider(createImageryProvider('ibo_w'));

const placeNames = createPlaceNames(viewer);
placeNames.initTDT(createInitialTiles());
flyToChina(viewer);

// 影像和国界服务使用相同的切片规则，仅图层类型不同。
function createImageryProvider(layerType) {
    return new Cesium.UrlTemplateImageryProvider({
        url: `${tdtUrl}DataServer?T=${layerType}&x={x}&y={y}&l={z}&tk=${token}`,
        subdomains,
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        maximumLevel: 18,
        credit: '天地图',
        enablePickFeatures: false
    });
}

function createTerrainProvider() {
    const urls = subdomains.map(subdomain =>
        `${tdtUrl.replace('{s}', subdomain)}mapservice/swdx?T=elv_c&tk=${token}`
    );
    return new Cesium.GeoTerrainProvider({
        urls,
        credit: '天地图'
    });
}

function createPlaceNames(viewer) {
    const placeNames = new Cesium.GeoWTFS({
        viewer,
        subdomains,
        metadata: {
            boundBox: {
                minX: -180,
                minY: -90,
                maxX: 180,
                maxY: 90
            },
            minLevel: 1,
            maxLevel: 20
        },
        aotuCollide: true, // 插件原有参数名（拼写如此），控制标注避让。
        collisionPadding: [5, 10, 8, 5], // 标注避让的内边距：上、右、下、左。
        serverFirstStyle: true, // 优先采用服务端样式。
        labelGraphics: {
            font: '28px sans-serif',
            fontSize: 28,
            fillColor: Cesium.Color.WHITE,
            scale: 0.5,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 5,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground: false,
            backgroundColor: Cesium.Color.RED,
            backgroundPadding: new Cesium.Cartesian2(10, 10),
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            eyeOffset: Cesium.Cartesian3.ZERO,
            pixelOffset: new Cesium.Cartesian2(0, 8)
        },
        billboardGraphics: {
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            eyeOffset: Cesium.Cartesian3.ZERO,
            pixelOffset: Cesium.Cartesian2.ZERO,
            alignedAxis: Cesium.Cartesian3.ZERO,
            color: Cesium.Color.WHITE,
            rotation: 0,
            scale: 1,
            width: 18,
            height: 18
        }
    });
    // 插件会替换 URL 中的瓦片坐标、图标 ID 和子域名。
    placeNames.getTileUrl = function () {
        return `${tdtUrl}mapservice/GetTiles?lxys={z},{x},{y}&VERSION=1.0.0&tk=${token}`;
    };
    placeNames.getIcoUrl = function () {
        return `${tdtUrl}mapservice/GetIcon?id={id}&tk=${token}`;
    };

    return placeNames;
}

function createInitialTiles() {
    const level = 2;
    const tileSpan = 180 / (2 ** level);
    // 插件的地名瓦片采用经纬度切片；保留原示例的初始坐标及请求顺序。
    const tileCoordinates = [
        [6, 1],
        [7, 1],
        [6, 0],
        [7, 0],
        [5, 1],
        [4, 1],
        [5, 0],
        [4, 0],
        [6, 2],
        [6, 3],
        [7, 2],
        [5, 2],
        [4, 2],
        [3, 1],
        [3, 0],
        [2, 0],
        [0, 1],
        [1, 0],
        [0, 0]
    ];

    return tileCoordinates.map(([x, y]) => ({
        x,
        y,
        level,
        boundBox: {
            minX: -180 + x * tileSpan,
            minY: 90 - (y + 1) * tileSpan,
            maxX: -180 + (x + 1) * tileSpan,
            maxY: 90 - y * tileSpan
        }
    }));
}

function flyToChina(viewer) {
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(103.84, 31.15, 20000000),
        orientation: {
            heading: Cesium.Math.toRadians(348.4202942851978),
            pitch: Cesium.Math.toRadians(-89.74026687972041),
            roll: 0
        }
    });
}
