//グローバル変数
var mouseIsPressed = false; //マウスが押されているときtrue,押されていないときfalse
let activecanvas;

//マウスのボタンを押したとき
document.addEventListener('pointerdown',function(){  //変更
    mouseIsPressed = true;  
});

//マウスのボタンを離したとき
document.addEventListener('pointerup',function(){    //変更
    mouseIsPressed = false;
});


function disableScroll(event){
    event.preventDefault();
}


//シーンのクラス
class IScene extends THREE.Scene{

    constructor(option){
        super();

        //シーンのオプション
        const defaultvalues = {projection:'pers', light:'4color', background:0xdddddd};  //オプションのデフォルト値
        option = {...defaultvalues, ...option}; //デフォルトオプションに入力されたオプションを上書き

        //キャンバスサイズ
        const canvaswidth = 760;    
        const canvasheight = 540;

        //キャンバス
        this.block = document.createElement('div');
        this.canvas = document.createElement('canvas');
        document.body.appendChild(this.block);
        this.block.appendChild(this.canvas); //webページにキャンバスを追加

        //マウスイベント
        this.IInputReader = new IInputReader();

        //このキャンバス上でマウスを動かしたときの処理

        this.canvas.addEventListener('pointerdown',()=>this.IInputReader.IsMouseDown = true, false); //変更
        this.canvas.addEventListener('pointerup',()=>this.IInputReader.IsMouseDown = false, false);  //変更
        this.canvas.addEventListener('pointermove',(event)=>this.IInputReader.mousemove(event),false);//変更

        this.randid = randstr();
        let that = this;

        this.canvas.addEventListener('pointerdown',function(){activecanvas = that.randid;}, false); //変更


        this.canvas.style.touchAction = 'none';

        

        //レンダラ
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias:true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);   
        this.renderer.setSize(canvaswidth, canvasheight);  //レンダラのサイズ設定
        this.renderer.setClearColor(option.background);  //背景色

        //カメラ
        if(option.projection=='pers'){  //透視投影（第1引数：視野角, 第2引数：アスペクト比）
            this.camera = new THREE.PerspectiveCamera(45, canvaswidth/canvasheight);    
        }else{   //平行投影(第5,6引数：奥行方向の範囲)
            this.camera = new THREE.OrthographicCamera(-canvaswidth/2, canvaswidth/2, canvasheight/2, -canvasheight/2, 1, 10000);  
        }
        this.camera.position.set(0, 0, 1000);   //カメラ位置


        //ライティング（mathematica風）
        let lighta = new THREE.AmbientLight(0x663333); //環境光

        if(option.light=='4color'){
            let light1 = new THREE.DirectionalLight(0x002E80,2);   //指向性ライト
            let light2 = new THREE.DirectionalLight(0x3e903e,2);
            let light3 = new THREE.DirectionalLight(0x902e00,2);
            let light4 = new THREE.DirectionalLight(0x00003d,2);
            light1.position.copy(new THREE.Vector3(1,0,1));
            light2.position.copy(new THREE.Vector3(2,2,3));
            light3.position.copy(new THREE.Vector3(0,2,2));
            light4.position.copy(new THREE.Vector3(0,0,2));
            this.add(lighta, light1, light2, light3, light4);
        }else{
            let light5 = new THREE.DirectionalLight(0xffffff,1);
            light5.position.copy(new THREE.Vector4(0,1,3));
            this.add(lighta, light5);
        }


        //その他変数
        this.parasliders = [];   //スライダーの変数情報
        this.object = [];   //オブジェクトの情報
        this.cuttingplanes; //クリッピング平面
        this.angularvelocity = new THREE.Vector3();   //回転
        this.clock = new THREE.Clock();   //経過時間を図るタイマー

        this.dummymesh = new THREE.Mesh;    //回転後の姿勢を取得するためのダミーオブジェクト

        this.Ianimation();  //描画処理を開始して繰り返す
    }


    //描画処理
    Ianimation(){

        //パラメータをスライダーの値に更新
        for(let i=0; i<this.parasliders.length; i++){
            let str = this.parasliders[i][0] + '=' + this.parasliders[i][1].value + ';';
            eval(str);
        }

        //マウスの変位から回転軸を設定
        let tmpv = this.angularvelocity;
        if(this.IInputReader.IsMouseDown){
            tmpv = new THREE.Vector3(this.IInputReader.MouseMovementY, this.IInputReader.MouseMovementX, 0);
        }
        this.angularvelocity.lerp(tmpv, 0.2);   //1フレーム前の回転軸と平滑化

        this.IInputReader.update();

        let axis, rad;
        axis = this.angularvelocity.clone().normalize();    //回転軸　　　ベクトルを正規化
        rad = this.angularvelocity.length() * 0.018;        //回転の速さ　ベクトルの大きさ×定数

        if(rad<0.001) rad = 0;  //動きが小さいとき停止させる

        this.dummymesh.rotateOnWorldAxis(axis, rad);    //ダミーオブジェクトを回転

        
        //オブジェクトの更新・回転
        for(let i=0; i<this.object.length; i++){
            if(this.object[i].ready){
                //this.object[i].Iupdate();

                this.object[i].mesh.rotateOnWorldAxis(axis, rad);
                this.object[i].wiremesh.rotateOnWorldAxis(axis, rad);
                
            }
        }

    

        //クリッピング
        if(this.cuttingplanes!=undefined){
            this.renderer.clippingPlanes = []   //clippingPlanesの初期化
            let tmpc = eval(this.cuttingplanes);    //テキストファイルの文字列を翻訳
            if(!Array.isArray(tmpc[0])) tmpc = [tmpc];
            for(let i=0; i<tmpc.length; i++){
                let v1 = new THREE.Vector3(tmpc[i][0], tmpc[i][1], tmpc[i][2]); //平面を表すベクトル
                v1.applyEuler(this.dummymesh.rotation); //ベクトルを回転
                this.renderer.clippingPlanes.push(new THREE.Plane(v1.clone().normalize(), v1.length()));
            }
        }

        //レンダリング
        this.renderer.render(this, this.camera);
            


        requestAnimationFrame(()=>this.Ianimation());

    }


    //マウスを動かしたとき
    mousemoveevent(event){
        if(mouseIsPressed){
            let dx = event.movementX;
            let dy = event.movementY;
            this.angle = Math.min((dx*dx+dy*dy)*0.003, 0.1);
        }
    }


    //パラメータスライダーの追加
    IaddSlider(parameter, option){
        const defaultvalues = {width:200, height:50, min:0, max:100, step:1, init:null}; //スライダーのデフォルト値
        option = {...defaultvalues, ...option}; //スライダーのデフォルトオプションと入力されたオプションをマージ

        let tmp = document.createElement('input');   //入力要素を生成
        let that = this;

        tmp.type = 'range'; //入力要素の種類をスライダーに設定
        tmp.addEventListener('input',function(){
            for(let i=0; i<that.object.length; i++){
                if(that.object[i].ready){
                    that.object[i].Iupdate();
                }
            }
        });

        let sliderlabel = document.createElement('p');
        sliderlabel.textContent = parameter;
        this.block.appendChild(sliderlabel);
        this.block.appendChild(tmp);    //webページにスライダーを追加
        
        //スライダーの設定
        tmp.style.width = option.width;
        tmp.style.height = option.height;
        tmp.min = option.min;
        tmp.max = option.max;
        tmp.step = option.step;
        if(option.init!=null)  tmp.value = option.init;
        else    tmp.value = (option.min+option.max)/2;
        

        tmp.style.scale = 3;
        tmp.style.marginLeft = '220px';


        this.parasliders.push([parameter, tmp]);    //パラメータ名とスライダーを記録

    }


    //IGraphicComplexクラスを呼び出し、オプションを渡す
    IaddObject(vtsstring, index, option){
        const defaultvalues = {scale:1, material:'custom', range:false, wireframe:false};
        option = {...defaultvalues, ...option};
        this.object.push(new IGraphicComplex(vtsstring, index, this, option));
    }

    //IAnimeGraphicComplexクラスを呼び出し、オプションを渡す
    IaddAnimeObject(vtsfilename, indexfilename, option){
        const defaultvalues = {scale:1, material:'custom'};
        option = {...defaultvalues, ...option}; 
        this.object.push(new IAnimeGraphic(vtsfilename, indexfilename, this, option));
    }

    //クリッピング初期設定
    IaddCuttingPlanes(planefilename, option){
        const defaultvalues = {scale:1};
        option = {...defaultvalues, ...option};

        let that = this;
        $.get(planefilename,function(response){ //テキストファイル読み込み

            //配列の各要素にscaleをかける（文字列処理）
            response = response.split('[[').join('{[');
            response = response.split('],').join(']#');
            response = response.split('[').join('['+option.scale+'*');
            response = response.split(',').join(','+option.scale+'*')
            response = response.split('{').join('[');
            response = response.split('#').join(',');

            that.cuttingplanes = response;
        });
    }

    
}



//パラメータ入り3Dモデル
class IGraphicComplex{
        
    //初期設定
    constructor(vtsfilename, indexfilename, scene, option){

        this.vtsstring;
        this.index;
        this.scene = scene;
        this.option = option;

        this.geometry = new THREE.BufferGeometry();
        this.wiregeometry = new THREE.BufferGeometry();
        this.mesh;
        this.wiremesh;

        this.dslider1;
        this.dslider2;
        this.rectdisp;
        this.check1;
        this.check2;
        this.check3;

        this.ready = false;

        let that =  this;

        //頂点テキストファイルの読み込み
        function f1(){
            return new Promise((resolve)=>{
                $.get(vtsfilename, function(response){
                    that.vtsstring = response;
                    resolve();
                });
            });
        }

        function f2(){
            return new Promise((resolve)=>{
                $.get(indexfilename, function(response){
                    response = response.split('.,').join(',');
                    response = response.split('.]').join(']');
                    response = response.split(' ').join('');
                    that.index = JSON.parse(response);
                    resolve();
                });
            });
        }

        async function f3(){
            return new Promise((resolve)=>{

                that.Iupdate();

                //ポリゴンの頂点番号を設定
                let tmp;
                if(Array.isArray(that.index[0][0])){
                    tmp = that.index.flat(1);
                }else   tmp = that.index;
                that.geometry.setIndex(tripoly(tmp));
                that.wiregeometry.setIndex(tripoly(tmp));


                //マテリアルの設定
                let material, wirematerial;
                if(that.option.material=='normal'){
                    material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});    //NormalMaterial（ライティングを無視する）
                }else if(that.option.material=='custom'){
                    material = new THREE.MeshLambertMaterial({side:THREE.DoubleSide});   //ツヤのないマテリアル（ライトが必要）
                }else{
                    material = new THREE.MeshLambertMaterial({side:THREE.DoubleSide, color:that.option.material});
                }
                material.flatShading = true;   //フラットシェード

                wirematerial = new THREE.MeshLambertMaterial({color:0x000000, wireframe:true});

                //メッシュ（ジオメトリ＋マテリアル）の生成
                
                that.mesh = new THREE.Mesh(that.geometry, material);
                that.wiremesh = new THREE.Mesh(that.wiregeometry, wirematerial);

                that.mesh.scale.x = that.option.scale;
                that.mesh.scale.y = that.option.scale;
                that.mesh.scale.z = that.option.scale;

                that.wiremesh.scale.x = that.option.scale;
                that.wiremesh.scale.y = that.option.scale;
                that.wiremesh.scale.z = that.option.scale;

                //シーンにメッシュを追加
                scene.add(that.mesh);  
                if(option.wireframe)  scene.add(that.wiremesh);

                that.ready = true;


                if(that.option.range){

                    if(Array.isArray(that.index[0][0])){

                        let container = document.createElement('div');
                        that.scene.block.appendChild(container);
                        container.className = 'parentdiv';

                        that.dslider1 = document.createElement('div');
                        that.dslider1.className = 'range-wrapper2';
                        container.appendChild(that.dslider1);

                        that.dslider2 = document.createElement('div');
                        that.dslider2.className = 'range-wrapper3';
                        container.appendChild(that.dslider2);

                        that.rectdisp = document.createElement('canvas');
                        that.rectdisp.className = 'rectdisp';
                        container.appendChild(that.rectdisp);

                       
                        IaddRangeSlider(that.dslider1, 0, that.index.length, that.index.length, 'horizontal', false);
                        IaddRangeSlider(that.dslider2, 0, that.index[0].length, that.index[0].length, 'vertical', false);

                        that.check1 = document.createElement('input');
                        that.check1.type = 'checkbox';
                        that.check1.className = 'check2';
                        container.appendChild(that.check1);

                        that.check2 = document.createElement('input');
                        that.check2.type = 'checkbox';
                        that.check2.className = 'check3';
                        container.appendChild(that.check2);

                        that.check3 = document.createElement('input');
                        that.check3.type = 'checkbox';
                        that.check3.className = 'check4';
                        container.appendChild(that.check3);

                        let label = document.createElement('p');
                        label.textContent = 'AND';
                        label.className = 'label1';
                        container.appendChild(label);

                        let button1 = document.createElement('button');
                        button1.textContent = '反転';
                        button1.className = 'button1';
                        container.appendChild(button1);
                        button1.addEventListener('click',()=>{
                            that.check1.checked = !that.check1.checked;  
                            that.check2.checked = !that.check2.checked;  
                            that.check3.checked = !that.check3.checked;  
                            check1event();
                            check2event();
                            check3event();
                        });
                        


                        that.dslider1.noUiSlider.on('update',function(){
                            Irectupdate();
                            IindexUpdate();
                        });
                        that.dslider2.noUiSlider.on('update',function(){
                            Irectupdate();
                            IindexUpdate();
                        });

                        that.check1.addEventListener('change',()=>{
                            check1event();
                        });

                        function check1event(){
                            let a1 = that.dslider1.noUiSlider.get()[0];
                            let a2 = that.dslider1.noUiSlider.get()[1];

                            that.dslider1.noUiSlider.destroy();

                            if(that.check1.checked){
                                IaddRangeSlider(that.dslider1, a1, a2, that.index.length, 'horizontal', true);
                            }else{
                                IaddRangeSlider(that.dslider1, a1, a2, that.index.length, 'horizontal', false);
                            }

                            that.dslider1.noUiSlider.on('update',function(){
                                Irectupdate();
                                IindexUpdate();
                            });

                        }


                        that.check2.addEventListener('change',()=>{
                            check2event();
                        });

                        function check2event(){
                            let a1 = that.dslider2.noUiSlider.get()[0];
                            let a2 = that.dslider2.noUiSlider.get()[1];

                            that.dslider2.noUiSlider.destroy();

                            if(that.check2.checked){
                                IaddRangeSlider(that.dslider2, a1, a2, that.index[0].length, 'vertical', true);  
                            }else{
                                IaddRangeSlider(that.dslider2, a1, a2, that.index[0].length, 'vertical', false);
                            }

                            that.dslider2.noUiSlider.on('update',function(){
                                Irectupdate();
                                IindexUpdate();
                            });
                        }

                        that.check3.addEventListener('change',()=>{
                            check3event();
                        })

                        function check3event(){
                            if(that.check3.checked) label.textContent = 'OR';
                            else    label.textContent = 'AND';
                            Irectupdate();
                            IindexUpdate();
                        }


                    }else{

                        let container = document.createElement('div');
                        that.scene.block.appendChild(container);
                        container.className = 'yoko';

                        that.dslider1 = document.createElement('div');
                        that.dslider1.className = 'range-wrapper1';
                        container.appendChild(that.dslider1);

                        that.check1 = document.createElement('input');
                        that.check1.type = 'checkbox';
                        that.check1.className = 'check1';
                        container.appendChild(that.check1);

                        IaddRangeSlider(that.dslider1, 0, that.index.length, that.index.length, 'horizontal', false);

                        
                        that.dslider1.noUiSlider.on('update',function(){
                            IindexUpdate();
                        });
                        
                        that.check1.addEventListener('change',(event)=>{

                            let a1 = that.dslider1.noUiSlider.get()[0];
                            let a2 = that.dslider1.noUiSlider.get()[1];
                            that.dslider1.noUiSlider.destroy();

                            if(event.currentTarget.checked){
                                IaddRangeSlider(that.dslider1, a1, a2, that.index.length, 'horizontal', true);
                            }else{
                                IaddRangeSlider(that.dslider1, a1, a2, that.index.length, 'horizontal', false);
                            }

                            that.dslider1.noUiSlider.on('update',function(){
                                IindexUpdate();
                            });
                        })
                        
                    }


                    function IaddRangeSlider(sli, a1, a2, a3, muki, rev){

                        let con;
                        if(!rev) con = true;
                        else    con = [true, false, true];

                        noUiSlider.create(sli, {
                            range: {
                                'min': 0,
                                'max': a3,
                            },
                            step: 1,
                            start: [a1, a2],
                            //margin: 1,
                            orientation: muki,
                            connect: con,
                            behaviour: 'tap-drag',
                        });
                        
                    }

                    function Irectupdate(){

                        let context = that.rectdisp.getContext('2d');
                
                        context.beginPath();

                        //背景色
                        context.fillStyle = 'rgb(230, 240, 230)';
                        context.fillRect(0,0,that.rectdisp.width, that.rectdisp.height);
                
                        let a1 = Number(that.dslider1.noUiSlider.get()[0]);
                        let a2 = Number(that.dslider1.noUiSlider.get()[1]);
                        let a3 = Number(that.dslider1.noUiSlider.options.range.min);
                        let a4 = Number(that.dslider1.noUiSlider.options.range.max);
                        let b1 = Number(that.dslider2.noUiSlider.get()[0]);
                        let b2 = Number(that.dslider2.noUiSlider.get()[1]);
                        let b3 = Number(that.dslider2.noUiSlider.options.range.min);
                        let b4 = Number(that.dslider2.noUiSlider.options.range.max);

                        let lista = [a3, a1, a2, a4];
                        let listb = [b3, b1, b2, b4];
                        lista = lista.map(function(a){return that.rectdisp.width*a/(a4-a3)});
                        listb = listb.map(function(a){return that.rectdisp.height*a/(b4-b3)});
                        
                        let listc, listd;
                        if(that.check1.checked) listc = [true, false, true];
                        else    listc = [false,  true, false];
                        if(that.check2.checked) listd = [true, false, true];
                        else    listd = [false, true, false];

                        for(let i=0; i<3; i++)  for(let j=0; j<3; j++){
                            if( (!that.check3.checked&&listc[i]&&listd[j]) || (that.check3.checked&&(listc[i]||listd[j]))) context.fillStyle = 'rgb(35, 173, 163)';
                            else    context.fillStyle = 'rgb(230, 240, 230)';
                            context.fillRect(lista[i],listb[j],lista[i+1]-lista[i],listb[j+1]-listb[j]);
                        }

                    }

                    function IindexUpdate(){

                        let tmp

                        if(Array.isArray(that.index[0][0])){

                            let a1, a2, b1, b2;
                            a1 = Number(that.dslider1.noUiSlider.get()[0]);
                            a2 = Number(that.dslider1.noUiSlider.get()[1]);
                            b1 = Number(that.dslider2.noUiSlider.get()[0]);
                            b2 = Number(that.dslider2.noUiSlider.get()[1]);

                            let f1, f2;

                            tmp = [];

                            for(let i=0; i<that.index.length; i++)  for(let j=0; j<that.index[0].length; j++){
                                if(!that.check1.checked)    f1 = a1<=i && i<a2;
                                else    f1 = i<a1 || i>=a2;
                                if(!that.check2.checked)    f2 = b1<=j && j<b2;
                                else    f2 = j<b1 || j>=b2;
                                if((!that.check3.checked&&f1&&f2) || (that.check3.checked&&(f1||f2)))  tmp.push(that.index[i][j]);
                                
                            }

                            that.geometry.setIndex(tripoly(tmp));

                        }else{

                            if(!that.check1.checked)   tmp = that.index.slice(Number(that.dslider1.noUiSlider.get()[0]),Number(that.dslider1.noUiSlider.get()[1]));
                            else    tmp = that.index.slice(0,Number(that.dslider1.noUiSlider.get()[0])).concat(that.index.slice(Number(that.dslider1.noUiSlider.get()[1],that.index.length)));
                            that.geometry.setIndex(tripoly(tmp));

                        }
                    }

                }

                resolve();
            });
        }

        f1().then(()=>f2()).then(()=>f3());

        

    }


    

    //頂点座標の更新
    Iupdate(){

        let tmp;

        //ポリゴンの頂点座標を設定
        if(typeof(this.vtsstring)=='string')    tmp = eval(this.vtsstring).flat();     //頂点配列がパラメータ入り文字列のとき
        else    tmp = this.vtsstring.flat();    //頂点配列が数値のとき
        this.geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(tmp), 3 ) );
        this.wiregeometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(tmp), 3 ) );

        //頂点法線の計算
        this.geometry.computeVertexNormals();
        this.wiregeometry.computeVertexNormals();


    }

}


//コマ送りモデル
class IAnimeGraphic{

    constructor(vtsfilename, indexfilename, scene, option){

        this.vtsa = [];
        this.indexa;
        this.option = option;
        this.ready = false;

        this.geometry;
        this.mesh;
        this.wiremesh;

        let that = this;
        
        //頂点テキストファイルの読み込み
        function f1(){
            return new Promise((resolve)=>{
                $.get(vtsfilename, function(response){
                    response = response.split('.,').join(',');
                    response = response.split('.]').join(']');
                    response = response.split(' ').join('');
                    that.vtsa = JSON.parse(response);
                    resolve();
                });
            });
        }

        //インデックステキストファイルの読み込み
        function f2(){
            return new Promise((resolve)=>{
                $.get(indexfilename, function(response){
                    response = response.split('.,').join(',');
                    response = response.split('.]').join(']');
                    response = response.split(' ').join('');
                    that.indexa = JSON.parse(response);
                    resolve();
                });
            });
        }

        async function f3(){
            return new Promise((resolve)=>{
                
                //頂点配列に2個以上のGraphicComplexが含まれている場合スライダー生成
                if(that.vtsa.length!=1){
                    that.slider = document.createElement('input');  
                    that.slider.type = 'range';
                    that.slider.addEventListener('input',function(){
                        that.Iupdate();
                    });
                    scene.block.appendChild(document.createElement('p')); //改行
                    scene.block.appendChild(that.slider); //webページにスライダー追加

                    //スライダー設定
                    that.slider.style.width = 200;
                    that.slider.style.height = 100;
                    that.slider.style.scale = 3;
                    that.slider.style.marginLeft = '220px';
                    that.slider.min = 0;
                    that.slider.max = that.vtsa.length-1;    
                    that.slider.value = 0;

                }

                that.geometry = new THREE.BufferGeometry();

                //ポリゴンの頂点座標を設定
                
                let tmp = that.vtsa[0].flat();
                that.geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(tmp), 3 ) );

                //ポリゴンの頂点番号を設定
                tmp = that.indexa[0];
                
                that.geometry.setIndex(tripoly(that.indexa[0]));

                //頂点法線の計算
                that.geometry.computeVertexNormals();   

                //マテリアルの設定
                let material;

                if(that.option.material=='normal'){
                    material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
                }else{
                    material = new THREE.MeshLambertMaterial({side:THREE.DoubleSide});
                }
                material.flatShading = true;   //フラットシェード

                let wirematerial = new THREE.MeshLambertMaterial({color:0x000000, wireframe:true});


                //メッシュ（ジオメトリ＋マテリアル）の生成
                that.mesh = new THREE.Mesh(that.geometry, material);
                that.wiremesh = new THREE.Mesh(that.geometry, wirematerial);

                that.mesh.scale.x = that.option.scale;
                that.mesh.scale.y = that.option.scale;
                that.mesh.scale.z = that.option.scale;
                that.wiremesh.scale.x = that.option.scale;
                that.wiremesh.scale.y = that.option.scale;
                that.wiremesh.scale.z = that.option.scale;

                //シーンにメッシュを追加
                scene.add(that.mesh);   
                if(option.wireframe)    scene.add(that.wiremesh);

                that.ready = true;

                resolve();
            });
        }

        f1().then(()=>f2()).then(()=>f3());

        

    }

    Iupdate(){
        if(this.vtsa.length!=1){
            //ポリゴンの頂点座標を設定
            let tmp = this.vtsa[this.slider.value].flat();  //（スライダーの値）番目の頂点リストを取り出す
            this.geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(tmp), 3 ) );

            //ポリゴンの頂点番号を設定
            this.geometry.setIndex(tripoly(this.indexa[this.slider.value]));

            //頂点法線の計算
            this.geometry.computeVertexNormals();   

        }

    }
}


//マウスイベント
class IInputReader{
    constructor(){
        this.IsMouseDown = false;
        this.MouseMovementX = 0;
        this.MouseMovementY = 0;
    }

    update(){
        this.MouseMovementX = 0;
        this.MouseMovementY = 0;
    }

    mousemove(event){
        if(this.IsMouseDown){
            this.MouseMovementX = event.movementX;
            this.MouseMovementY = event.movementY;
        }
    }
}


//多角形ポリゴンのポリゴンインデックスを三角形ポリゴンに変換(three.jsの規格に合わせてフラットする)
function tripoly(list){
    let result = [];
    for(let i=0; i<list.length; i++){ //三角ポリゴンに変換
        for(let j=0; j<list[i].length-2; j++){
            result.push(list[i][0], list[i][1+j], list[i][2+j]);
        }
    }
    return result;
}


//ランダムな文字列を返す（スライダーにIDを振るために用意したが結局使ってない）
function randstr(){
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for ( var i = 0; i < 8; i++ ) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


