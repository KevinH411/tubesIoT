package com.example.tubesIoT.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;
import java.util.Set;

@Entity
@Table(name = "tanah")
@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString(exclude = {"lahanList", "users"})
public class Tanah {

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
    private List<Lahan> lahanList;

    @JsonIgnore
    @ManyToMany(mappedBy = "tanahList")
    private Set<User> users;
}
