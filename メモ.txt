「ローカルサーバーの起動」

このプログラムを実行するにはindexファイルを直接開くのではなく、サーバーを立ち上げる必要がある
以下、pythonを使ってローカルサーバーを立ち上げる手順である
pythonがインストールされているかどうかはコマンドプロンプト（ターミナル）で「python -V」と入力すると確認できる
インストールされていればpythonのバージョンが表示される

１．コマンドプロンプト（ターミナル）を起動する
２．「cd 」と入力し、コマンドプロンプト（ターミナル）に実行したいhtmlファイルが入ったフォルダをドラッグする
　　（cdの後にフォルダのパスが表示される）
　　エンターを押してそのフォルダに移動する
３．python -m http.server 8000と入力するとローカルサーバーが立ち上がる
　　（うまくいかなければ、python -m SimpleHTTPServer 8000 もしくは python3 -m http.server 8000 を試す）
４．ブラウザを開いてURLに「localhost:8000」と入力する
　　（プログラムが実行される）



「プログラムの記述方法」

キャンバスを追加する際は
let (シーン名) = new IScene();
(シーン名).IaddSlider('変数名', オプション); ※数式の頂点リストに変数を含む場合
(シーン名).IaddObject(頂点リスト, ポリゴンインデックスリスト); 
の順番で記述する


「スライダーのオプション(デフォルト値)」

wdith スライダーの幅　(200)
height スライダーの高さ（間隔、太くはならない）(40)
min 最小値　(0)
max 最大値　(100)
step ステップ量　(1)
init 初期値　((min+max)/2)


「IaddObject,IaddAnimeObjectのオプション(第３引数)」

scale：オブジェクトの拡大縮小（デフォルト値１）
material：'custom' Mathematica風ライティング（デフォルト）
　　　　　 'normal' three.jsのMeshNormalMaterial


「ISceneのオプション」

projection:'pers' 透視投影（デフォルト）
　　　　　　'ortho'　平行投影


「IaddCuttingPlanes」

(x,y,z)を通る法線ベクトルが(x,y,z)の平面を[x,y,z]と表し、テキストファイルに記述
cutting planeが複数ある場合は、[[x1,y1,z1],[x2,y2,z2],...]のように2次元配列で表す
IaddCuttingPlanesの第一引数がテキストファイル名、第二引数がオプション

オプション
・scale:(定数)
　　平面を表すベクトルをscale倍する

