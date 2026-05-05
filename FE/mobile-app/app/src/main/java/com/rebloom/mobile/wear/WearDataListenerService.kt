package com.rebloom.mobile.wear

import android.util.Log
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService
import java.io.File
import java.io.FileWriter

class WearDataListenerService : WearableListenerService() {

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        dataEvents.forEach { event ->
            if (event.type == DataEvent.TYPE_CHANGED &&
                event.dataItem.uri.path?.startsWith("/biometric/") == true) {  // ← 수정

                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap

                val tsStart = dataMap.getLong("tsStart")
                val tsEnd = dataMap.getLong("tsEnd")
                val hr = dataMap.getFloat("hr")
                val ibi = dataMap.getFloat("ibi")
                val accXAvg = dataMap.getFloat("accXAvg")
                val accYAvg = dataMap.getFloat("accYAvg")
                val accZAvg = dataMap.getFloat("accZAvg")
                val sdnn = dataMap.getFloat("sdnn")
                val sdsd = dataMap.getFloat("sdsd")
                val rmssd = dataMap.getFloat("rmssd")
                val pnn20 = dataMap.getFloat("pnn20")
                val pnn50 = dataMap.getFloat("pnn50")
                val missingnessScore = dataMap.getFloat("missingnessScore")

                Log.d("WearDataListener", "데이터 수신: HR=$hr, RMSSD=$rmssd")

                saveToCsv(tsStart, tsEnd, hr, ibi, accXAvg, accYAvg, accZAvg,
                    sdnn, sdsd, rmssd, pnn20, pnn50, missingnessScore)
            }
        }
    }

    private fun saveToCsv(
        tsStart: Long, tsEnd: Long,
        hr: Float, ibi: Float,
        accXAvg: Float, accYAvg: Float, accZAvg: Float,
        sdnn: Float, sdsd: Float, rmssd: Float,
        pnn20: Float, pnn50: Float, missingnessScore: Float
    ) {
        val file = File(getExternalFilesDir(null), "biometric.csv")
        val isNew = !file.exists()

        FileWriter(file, true).use { writer ->
            if (isNew) {
                writer.append("ts_start,ts_end,hr,ibi,acc_x_avg,acc_y_avg,acc_z_avg,sdnn,sdsd,rmssd,pnn20,pnn50,missingness_score\n")
            }
            writer.append("$tsStart,$tsEnd,$hr,$ibi,$accXAvg,$accYAvg,$accZAvg,$sdnn,$sdsd,$rmssd,$pnn20,$pnn50,$missingnessScore\n")
        }

        Log.d("WearDataListener", "CSV 저장 완료: ${file.absolutePath}")
    }
}