export const VLCLogFilter = (s: string) => {
  if (
    // 表示遅延
    s.startsWith("picture is too late to be displayed") ||
    s.startsWith("picture might be displayed late") ||
    s.startsWith("More than") ||
    s.startsWith("buffer too late") ||
    s.startsWith("discontinuity received 0") ||
    // gnutls
    s.startsWith("in DATA (0x00) frame of") ||
    s.startsWith("out WINDOW_UPDATE (0x08) frame ")
  ) {
    return { category: "commonplace" } as const
  } else if (s.startsWith("libdvbpsi error")) {
    return { category: "libdvbpsi_error" } as const
  } else if (s.startsWith("Stream buffering done")) {
    return { category: "stream_buffering_done" } as const
  } else if (s.startsWith("Decoder wait done")) {
    return { category: "decoder_wait_done" } as const
  } else if (s.startsWith("size ") && s.includes("fps=")) {
    const m = s.match(/(\d+)x(\d+)\/(\d+)x(\d+)\sfps=([\d.]+)/)
    if (!m) return { category: "size" } as const
    const [, displayWidth, displayHeight, width, height, fps] = m
    return {
      category: "size",
      displayWidth,
      displayHeight,
      width,
      height,
      fps,
    } as const
  } else if (s.startsWith("VoutDisplayEvent 'resize'")) {
    const m = s.match(/VoutDisplayEvent 'resize' (\d+)x(\d+)/)
    if (!m) return { category: "resize" } as const
    const [, width, height] = m
    return {
      category: "resize",
      width: parseInt(width),
      height: parseInt(height),
    } as const
  } else if (s.startsWith("tot,")) {
    const tot = parseInt(s.split(",").pop() || "NaN")
    if (Number.isNaN(tot)) {
      return { category: "tot" } as const
    }
    return {
      category: "tot",
      tot: (tot - 3600 * 9 * 2) * 1000,
    } as const
  } else if (s.startsWith("arib_data")) {
    const m = s.match(/^arib_data \[(.+)\]\[(\d+)\]$/)
    if (!m) return { category: "arib_data" } as const
    return {
      category: "arib_data",
      data: m[1],
      pts: parseInt(m[2]),
    } as const
  } else if (s.startsWith("i_pcr")) {
    const m = s.match(/^i_pcr \[(\d+)\]\[(\d+)\]$/)
    if (!m) return { category: "i_pcr" }
    return {
      category: "i_pcr",
      i_pcr: parseInt(m[1]),
      pcr_i_first: parseInt(m[2]),
    } as const
  } else if (s.startsWith("arib parser was destroyed")) {
    return { category: "arib_parser_was_destroyed" } as const
  } else if (s.startsWith("VLC is unable to open the MRL")) {
    return { category: "unable_to_open" } as const
  } else if (s.includes("successfully opened") && s.includes("http")) {
    return { category: "successfully_opened" } as const
  } else if (s.startsWith("Received first picture")) {
    return { category: "received_first_picture" } as const
  } else if (s.startsWith("EsOutProgramEpg")) {
    return { category: "es_out_program_epg" } as const
  } else if (s.startsWith("PMTCallBack called for program")) {
    return { category: "PMTCallBack_called_for_program" } as const
  } else if (s.startsWith("end of stream")) {
    return { category: "end_of_stream" } as const
  } else if (s.startsWith("EOF reached")) {
    return { category: "eof_reached" } as const
  } else if (s.startsWith("waiting decoder fifos to empty")) {
    return { category: "waiting_decoder_fifos_to_empty" } as const
  } else if (s.startsWith("Buffering")) {
    const m = s.match(/Buffering (\d+)%/)
    if (!m) return { category: "buffering" } as const
    return { category: "buffering", progress: parseInt(m[1]) } as const
  } else if (s.startsWith("configured with")) {
    return {
      category: "configured_with",
      isCustomized: s.includes("vlc-miraktest"),
    } as const
  } else if (s.startsWith("looking for audio resampler module matching")) {
    return {
      category: "audio_channel_updated",
    } as const
  } else {
    return { category: "unknown" } as const
  }
}

export const VLCAudioChannel = {
  Stereo: 1,
  ReverseStereo: 2,
  Left: 3,
  Right: 4,
  Dolby: 5,
}

export const VLCAudioChannelTranslated = [
  "ステレオ",
  "ステレオ",
  "反転ステレオ",
  "左",
  "右",
  "ドルビー",
]
