import OpenStreetMapLayer = require("esri/layers/OpenStreetMapLayer");
import Layer = require('esri/layers/layer');
import SimpleLineSymbol = require('esri/symbols/SimpleLineSymbol');
import SimpleFillSymbol = require('esri/symbols/SimpleFillSymbol');
import PictureFillSymbol = require('esri/symbols/PictureFillSymbol');
import PictureMarkerSymbol = require('esri/symbols/PictureMarkerSymbol');
import UniqueValueRenderer = require('esri/renderers/UniqueValueRenderer');
import FeatureLayer = require('esri/layers/FeatureLayer');
import SimpleRenderer = require('esri/renderers/SimpleRenderer');
import Color = require('esri/Color');
import urlUtils = require('esri/urlUtils');
import * as _ from "lodash";
import Graphic = require("esri/graphic");
import geometryEngine = require("esri/geometry/geometryEngine");

export type LayerType = City | Square | Osm;
export interface City { kind: "city"; }
export interface Square { kind: "square"; }
export interface Osm { kind: "osm"; }

export type AbaLayer = OsmLayer | CityBrailleLayer | SquareBrailleLayer;

urlUtils.addProxyRule({
  urlPrefix: "https://hepiageo.hesge.ch",
  //proxyUrl : "http://localhost:8880/proxy/proxy.php"
  proxyUrl : "https://audiotactile.ovh/proxy/proxy.php"
});


const surface = {
  hard: [
    "ilot",
    "trottoir",
    "autre_revetement_dur",
    "rocher",
    "place_aviation"
  ],
  building: [
    "batiment"
  ],
  water: [
    "eau_stagnante",
    "bassin",
    "cours_eau",
    "fontaine"
  ],
  green: [
    "roseliere",
    "paturage_boise_ouvert",
    "tourbiere",
    "autre_verte",
    "autre_culture_intensive",
    "paturage_boise_dense",
    "autre_boisee",
    "jardin",
    "foret_dense",
    "vigne",
    "champ_pre_paturage"
  ],
  linear:  [
    "route_chemin",
    "chemin_de_fer"
  ]
};

const HARD_SYMBOL = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, null, new Color('black'));

const url_traitilles = require("file?name=./assets/[name].[ext]!./img/traitilles.png");
const url_cercle = require("file?name=./assets/[name].[ext]!./img/cercle.png");

const BUILDING_SYMBOL = new PictureFillSymbol(url_traitilles, null, 15, 15);
const WATER_SYMBOL = new PictureFillSymbol(url_cercle, null, 15, 15);
const GREEN_SYMBOL = new PictureFillSymbol(url_traitilles, null, 25, 25);

const URL_FEATURE_LAYER = "https://hepiageo.hesge.ch/arcgis/rest/services/audiotactile/audiotactile/FeatureServer/3";

export class CityBrailleLayer extends FeatureLayer {

  constructor() {

    super(URL_FEATURE_LAYER, {
      id: 'city',
    });

    const defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, null, null);
    const renderer = new UniqueValueRenderer(defaultSymbol, "type");

    const champs = surface.linear.concat(surface.water, surface.green);
    const LINEAR_SYMBOL = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, null, new Color("black"));

    surface.water.forEach( (value) => renderer.addValue(value, WATER_SYMBOL) );
    //surface.green.forEach( (value) => renderer.addValue(value, GREEN_SYMBOL) );
    surface.linear.forEach( (value) => renderer.addValue(value, LINEAR_SYMBOL));

    this.setDefinitionExpression("type='" + champs.join("' or type='") + "'");
    this.setRenderer(renderer);

  }

}

export class SquareBrailleLayer extends FeatureLayer {

  constructor() {

    super(URL_FEATURE_LAYER, {
      id: 'square',
    });

    //const defaultSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, null, null);
    const defaultSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, null, null);
    const renderer = new UniqueValueRenderer(defaultSymbol, "type");

    //const champs = surface.green.concat(surface.building, surface.hard, surface.water, surface.linear);
    const champs = surface.building.concat(surface.hard, surface.water, surface.linear);
    const LINEAR_SYMBOL = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color("black"), 3);

    surface.linear.forEach((value) => renderer.addValue(value, LINEAR_SYMBOL));
    //surface.green.forEach((value) => renderer.addValue(value, GREEN_SYMBOL));
    surface.water.forEach((value) => renderer.addValue(value, WATER_SYMBOL));
    surface.building.forEach((value) => renderer.addValue(value, BUILDING_SYMBOL));
    surface.hard.forEach((value) => renderer.addValue(value, HARD_SYMBOL));

    this.setDefinitionExpression("type='" + champs.join("' or type='") + "'");
    //this.setDefinitionExpression("type='route_chemin' or type='chemin_de_fer'");
    this.setRenderer(renderer);
  }

  enumerate(n) {

    let ys = [];
    let processed = [];
    let xs = _.range(0, n);
    xs.forEach( (x) => {
      processed.push(x);
      let zs = _.difference(xs, processed);
      zs.forEach( (z) => ys.push([x, z]));
    });
    return ys;

  }

  indexSubArray(xs, ys) {
    let xi = 0;
    let yi = 0;
    while ( xi < xs.length - ys.length){
      if (xs[xi] === +ys[yi]){
        yi += 1;
        if (yi === ys.length) {
          return xi;
        }
      } else {
        yi = 0;
      }
      xi += 1;
    }
    return -1;
  }



  onGraphicAdd(graphic){

    if (graphic.attributes.type === 'route_chemin'){
      const xs = [];
      graphic.geometry.rings.forEach(r => {
        const set = _.flatten(r.map( g => [g, g])).slice(1);
        set.pop();
        xs.push(_.chunk(set, 2));
      });
      graphic.geometry.rings = _.flatten(xs);
      console.log(graphic.geometry.rings);
    }
  }

  onUpdateEnd(error, info){

    // Reorder paths
    this.graphics.filter( g => g.attributes.type === 'route_chemin' && g.getShape() !== null).forEach(g => g.getShape().moveToFront());

    const graphics = this.graphics.filter( g => g.attributes.type === 'route_chemin' && g.getShape() );
    const isSameSegments = (s1, s2) => {
      return (s1[0][0] === s2[0][0] && s1[0][1] == s2[0][1]) && (s1[1][0] === s2[1][0] && s1[1][1] == s2[1][1]) ||
             (s1[0][0] === s2[1][0] && s1[0][1] == s2[1][1]) && (s1[1][0] === s2[0][0] && s1[1][1] == s2[0][1])
    };

    this.enumerate(graphics.length).forEach( ([a, b]) => {
      console.log(a + " + " + b);
      const g1: any = graphics[a];
      const g2: any = graphics[b];
      _.intersectionWith(g1.geometry.rings, g2.geometry.rings, isSameSegments).forEach( s1 => {
        _.remove(g1.geometry.rings, s2 => isSameSegments(s1, s2));
        _.remove(g2.geometry.rings, s2 => isSameSegments(s1, s2));
      })
    });

    this.redraw();

  }
}

export class OsmLayer extends OpenStreetMapLayer {
  public id: string = "osm";
  constructor() {
    super();
    this.setMaxScale(25);
  }
}
