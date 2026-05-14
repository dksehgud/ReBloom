package com.rebloom.app.provisioning.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.view.isVisible
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.rebloom.app.R
import com.rebloom.app.provisioning.WifiNetwork

class WifiListAdapter(
    private val onNetworkSelected: (WifiNetwork) -> Unit
) : ListAdapter<WifiNetwork, WifiListAdapter.ViewHolder>(DIFF) {

    private var selectedSsid: String? = null

    inner class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvSignal: TextView = itemView.findViewById(R.id.tvSignal)
        val tvSsid: TextView   = itemView.findViewById(R.id.tvSsid)
        val tvLock: TextView   = itemView.findViewById(R.id.tvLock)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_wifi_network, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val network = getItem(position)
        holder.tvSignal.text = network.signalIcon
        holder.tvSsid.text = network.ssid
        holder.tvLock.isVisible = network.isSecured

        // 선택된 항목 하이라이트
        val isSelected = network.ssid == selectedSsid
        holder.itemView.setBackgroundColor(
            if (isSelected) 0x1A4361EE else 0x00000000
        )
        holder.tvSsid.setTextColor(
            if (isSelected) 0xFF4361EE.toInt() else 0xFF1A1A2E.toInt()
        )

        holder.itemView.setOnClickListener {
            val prev = selectedSsid
            selectedSsid = network.ssid
            // 이전 선택 항목 갱신
            currentList.indexOfFirst { it.ssid == prev }.takeIf { it >= 0 }?.let(::notifyItemChanged)
            notifyItemChanged(position)
            onNetworkSelected(network)
        }
    }

    companion object {
        private val DIFF = object : DiffUtil.ItemCallback<WifiNetwork>() {
            override fun areItemsTheSame(a: WifiNetwork, b: WifiNetwork) = a.ssid == b.ssid
            override fun areContentsTheSame(a: WifiNetwork, b: WifiNetwork) = a == b
        }
    }
}
