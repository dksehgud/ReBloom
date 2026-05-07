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
                event.dataItem.uri.path?.startsWith("/biometric/") == true) {

                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap

                val tsStart = dataMap.getLong("tsStart")
                val tsEnd = dataMap.getLong("tsEnd")
                val hr = dataMap.getFloat("hr")
                val ibi = dataMap.getFloat("ibi")
                val accXAvg = dataMap.getFloat("accXAvg")
                val accYAvg = dataMap.getFloat("accYAvg")
                val accZAvg = dataMap.getFloat("accZAvg")
                val accMag = dataMap.getFloat("accMag")
                val rmssd = dataMap.getFloat("rmssd")
                val pnn50 = dataMap.getFloat("pnn50")
                val lfHf = dataMap.getFloat("lfHf")
                val missingnessScore = dataMap.getFloat("missingnessScore")

                Log.d("WearDataListener", "데이터 수신: HR=$hr, RMSSD=$rmssd, LF/HF=$lfHf")

                saveToCsv(
                    tsStart, tsEnd, hr, ibi,
                    accXAvg, accYAvg, accZAvg, accMag,
                    rmssd, pnn50, lfHf, missingnessScore
                )
            }
        }
    }

    private fun saveToCsv(
        tsStart: Long, tsEnd: Long,
        hr: Float, ibi: Float,
        accXAvg: Float, accYAvg: Float, accZAvg: Float,
        accMag: Float,
        rmssd: Float, pnn50: Float,
        lfHf: Float,
        missingnessScore: Float
    ) {
        val file = File(getExternalFilesDir(null), "biometric.csv")
        val isNew = !file.exists()

        FileWriter(file, true).use { writer ->
            if (isNew) {
                writer.append("ts_start,ts_end,hr,ibi,acc_x_avg,acc_y_avg,acc_z_avg,acc_mag,rmssd,pnn50,lf_hf,missingness_score\n")
            }
            writer.append(
                try {
                    "$tsStart,$tsEnd,$hr,$ibi,$accXAvg,$accYAvg,$accZAvg,$accMag,$rmssd,$pnn50,$lfHf,$missingnessScore\n"
                } catch (e: Exception) {
                    TODO("Not yet implemented")
                } finally {
                }
            )
        }

        Log.d("WearDataListener", "CSV 저장 완료: ${file.absolutePath}")
    }
}