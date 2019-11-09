package com.access.control.services;

import com.access.control.dto.EmpleadoDto;
import com.access.control.model.Empleado;
import com.access.control.model.Piso;
import com.access.control.model.PisoPermiso;
import com.access.control.repository.EmpleadoRepository;
import com.access.control.repository.PisoRepository;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Service("empleadosServiceImpl")
public class EmpleadosServiceImpl implements EmpleadosService{
    @Autowired
    private EmpleadoRepository empleadosDao;

    @Autowired
    private PisoRepository pisoDao;

    @Override
    @Transactional
    public List<Empleado> getListEmpleados(boolean picture)
    {   Integer i=0;
        List<Empleado> emp = empleadosDao.findAll();
       /* if (picture) {
          for (i=0 ; i < emp.size(); i++){
              byte[] b = "No disponible".getBytes();
              emp.get(i).setPicture(b);
              emp.get(i).setHuella1(b);
              emp.get(i).setHuella2(b);
          }
        }*/
        return emp;
    }

    @Override
    @Transactional
    public Empleado getEmpleadoById(Long idEmpleado)
    {
        Empleado empl = empleadosDao.findById(idEmpleado).orElse(null);

        if(empl!=null){
            empl.getListPisos().forEach(
                    p ->{
                        if(p!=null)
                            p.setPisoId(p.getPisos().getId());
                    }
            );
            return empl;
        }
        return null;
    }

    @Override
    @Transactional
    public Empleado addEmpleado(@NotNull EmpleadoDto emp)
    {
        //emp.setPicture(Base64.getDecoder().decode(emp.getPicture()));
       // emp.setPicture(Arrays.asList(emp.getPicture().split(",")).get(1));
        //String encodedString = Base64.getEncoder().encodeToString(emp.geticture());
        //Empleado empleado = new DozerBeanMapper().map(emp, Empleado.class);
        List<Piso> pisos = pisoDao.findAllState(1);

        List<PisoPermiso> listpp = new ArrayList<>();
        pisos.forEach(
                p->{
                    listpp.add(new PisoPermiso(p,0));
                }
        );
        Empleado empleado = new Empleado(listpp);
        empleado.setDocument(emp.getDocument());
        empleado.setName(emp.getName());
        empleado.setBadgeAccess(emp.getBadgeAccess());
        empleado.setLastName(emp.getLastName());
        empleado.setBirthDate(emp.getBirthDate());
        empleado.setEmail(emp.getEmail());
        empleado.setSex(emp.getSex());
        empleado.setTelephone(emp.getTelephone());
        empleado.setEnabled(true);
        empleado.setState(1);
        empleado.setPicture(Base64.getDecoder().decode(Arrays.asList(emp.getPicture().split(",")).get(1)));

        final Empleado finalEmpleado = empleadosDao.save(empleado);
        //finalEmpleado.setListPisos(pisoPermisoRepository.saveAll(listpp));
        return getEmpleadoById(finalEmpleado.getId());
    }

    @Override
    @Transactional
    public Empleado updateEmpleado(EmpleadoDto emp,Long id)
    {
        Empleado empleado = new Empleado();
        empleado.setId(id);
        empleado.setDocument(emp.getDocument());
        empleado.setName(emp.getName());
        empleado.setBadgeAccess(emp.getBadgeAccess());
        empleado.setLastName(emp.getLastName());
        empleado.setBirthDate(emp.getBirthDate());
        empleado.setEmail(emp.getEmail());
        empleado.setSex(emp.getSex());
        empleado.setTelephone(emp.getTelephone());
        empleado.setEnabled(emp.getEnabled());
        empleado.setState(emp.getState());
        empleado.setPicture(Base64.getDecoder().decode(Arrays.asList(emp.getPicture().split(",")).get(1)));
        Empleado empl = empleadosDao.getOne(id);
        if(empl!=null){
            empleado.setHuella1(empl.getHuella1());
            empleado.setHuella2(empl.getHuella2());
            return getEmpleadoById(empleadosDao.saveAndFlush(empleado).getId());
        }
        return null;
    }

    @Override
    @Transactional
    public Empleado updateEmpleadoHuella(EmpleadoDto emp,Long id)
    {
        Empleado empl = empleadosDao.getOne(id);
        if(empl!=null){
            empl.setHuella1(emp.getHuella1());
            empl.setHuella2(emp.getHuella2());
            empleadosDao.saveAndFlush(empl);
            return getEmpleadoById(id);
        }
        return null;
    }

    @Override
    @Transactional
    public boolean deleteEmpleado(Empleado emp)
    {
         empleadosDao.delete(emp);
         return empleadosDao.findById(emp.getId()).isPresent();
    }

    @Override
    @Transactional
    public Empleado updatePisos(EmpleadoDto emp,Long id){

        Empleado empl = empleadosDao.getOne(id);
        if(empl!=null){
            empl.addListPisos(emp.getListPisos());
            empleadosDao.saveAndFlush(empl);
            return getEmpleadoById(id);
        }
        return null;
    }
}
