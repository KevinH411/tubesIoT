package com.example.tubesIoT.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "tanah")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"lokasiList", "users"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Tanah {

    @EqualsAndHashCode.Include
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tanah")
    private Long idTanah;

    @Column(nullable = false)
    private String pemilik;

    @Column(nullable = false)
    private String address;

    @JsonIgnore
    @OneToMany(mappedBy = "tanah", cascade = CascadeType.ALL)
    private List<Lokasi> lokasiList = new ArrayList<>();

    @JsonIgnore
    @ManyToMany(mappedBy = "tanahList")
    private Set<User> users = new HashSet<>();
}
