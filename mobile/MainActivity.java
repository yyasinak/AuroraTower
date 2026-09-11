package com.yyasinak.auroratower;
import android.app.Activity;
import android.os.Bundle;
import android.hardware.*;
import android.webkit.*;
import android.view.*;
public class MainActivity extends Activity implements SensorEventListener {
 private WebView web; private SensorManager sensors; private Sensor sensor; private long last;
 @Override public void onCreate(Bundle b){super.onCreate(b);
  getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
  web=new WebView(this);setContentView(web);
  web.setOverScrollMode(View.OVER_SCROLL_NEVER);web.setBackgroundColor(0xff080c1c);
  web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setSupportZoom(false);web.getSettings().setBuiltInZoomControls(false);web.getSettings().setDisplayZoomControls(false);web.getSettings().setTextZoom(100);web.setInitialScale(100);
  web.getSettings().setMediaPlaybackRequiresUserGesture(false);
  web.setWebViewClient(new WebViewClient(){@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return true;}});
  web.setWebChromeClient(new WebChromeClient());
  web.loadUrl("file:///android_asset/index.html");
  sensors=(SensorManager)getSystemService(SENSOR_SERVICE);sensor=sensors.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
 }
 @Override public void onResume(){super.onResume();if(web!=null)web.onResume();if(sensor!=null)sensors.registerListener(this,sensor,SensorManager.SENSOR_DELAY_GAME);}
 @Override public void onPause(){if(web!=null){web.evaluateJavascript("window.TowerMobilePause&&window.TowerMobilePause()",null);web.onPause();}sensors.unregisterListener(this);super.onPause();}
 @Override public void onSensorChanged(SensorEvent e){if(e.timestamp-last<16000000L)return;last=e.timestamp;float x=-e.values[0];web.evaluateJavascript("window.TowerTilt&&window.TowerTilt.sample("+Float.toString(x)+")",null);}
 @Override public void onAccuracyChanged(Sensor s,int a){}
 @Override public void onBackPressed(){web.evaluateJavascript("window.TowerMobilePause&&window.TowerMobilePause()",null);}
 @Override public void onDestroy(){web.destroy();super.onDestroy();}
}
