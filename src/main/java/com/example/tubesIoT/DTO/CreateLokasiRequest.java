package com.example.tubesIoT.DTO;

public class CreateLokasiRequest {
    private Long idTanah;
    private String note;

    public Long getIdTanah() {
        return idTanah;
    }

    public void setIdTanah(Long idTanah) {
        this.idTanah = idTanah;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}